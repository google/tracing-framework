#include "wtf/runtime.h"

#include <cstdint>
#include <fstream>
#include <sstream>

namespace wtf {

const Runtime::SaveOptions Runtime::SaveOptions::kDefault{};

namespace {
struct EventSnapshot {
  EventBuffer* event_buffer;
  OutputBuffer::PartHeader string_table_header;
  OutputBuffer::PartHeader event_buffer_header;
};

void WriteFileHeaderChunk(OutputBuffer* output_buffer) {
  static const uint32_t kMagicNumber = 0xdeadbeef;
  static const uint32_t kWtfVersion = 0xe8214400;
  static const uint32_t kFormatVersion = 10;

  // File header words.
  output_buffer->AppendUint32(kMagicNumber);
  output_buffer->AppendUint32(kWtfVersion);
  output_buffer->AppendUint32(kFormatVersion);

  // Header chunk.
  std::stringstream json_stream;
  json_stream << "{";
  json_stream << "\"type\": \"file_header\",";
  json_stream << "\"timebase\": 0,";  // We reset the platform to a 0 time base.
  json_stream << "\"flags\": [\"has_high_resolution_times\"],";
  json_stream << "\"contextInfo\": {";
  json_stream << "\"contextType\": \"script\",";
  json_stream << "\"title\": \"C++ Trace\"";
  json_stream << "}";  // contextInfo
  json_stream << "}";

  auto json_string = json_stream.str();

  OutputBuffer::PartHeader part_header{
      0x10000,  // Type.
      0,        // Offset
      static_cast<uint32_t>(json_string.size()),
  };
  OutputBuffer::ChunkHeader chunk_header{
      1,           // Id.
      0x1,         // Type
      0xffffffff,  // Start time
      0xffffffff,  // End time
  };
  output_buffer->StartChunk(chunk_header, &part_header, 1);
  output_buffer->Append(json_string.c_str(),
                        json_string.size());  // Not nul term.
  output_buffer->Align();
}

bool WriteEventChunk(OutputBuffer* output_buffer, EventSnapshot* snapshot,
                     bool clear_event_buffer) {
  // There will be two parts: string and event. The event part is actually
  // a merged combination of the meta event + each thread event.
  const size_t kPartCount = 2;
  OutputBuffer::PartHeader part_headers[kPartCount] = {
      snapshot->string_table_header, snapshot->event_buffer_header,
  };

  // Setup the chunk.
  // TODO(laurenzo): Get timestamps from the EventBuffer based on what it
  // has logged.
  OutputBuffer::ChunkHeader chunk_header{
      2,                               // Id.
      0x2,                             // Type = Events.
      0,                               // Start time.
      PlatformGetTimestampMicros32(),  // End time.
  };
  output_buffer->StartChunk(chunk_header, part_headers, kPartCount);
  bool success =
      snapshot->event_buffer->string_table()->WriteTo(
          &snapshot->string_table_header, output_buffer) &&
      snapshot->event_buffer->WriteTo(&snapshot->event_buffer_header,
                                      output_buffer, clear_event_buffer);

  return success;
}

}  // namespace

Runtime::Runtime() {
  PlatformInitializeThreading();

  // Force reference event types that we inline manually.
  StandardEvents::GetScopeLeaveEvent();

  // Force registration of the create zone event (or else we race in saving,
  // not declaring it for the first time until after we have emitted
  // definitions).
  StandardEvents::GetCreateZoneEvent();
}

Runtime* Runtime::GetInstance() {
  // Note that we use a dynamically allocated Runtime in order to avoid
  // it ever being destructed. There is just no sane way to guarantee that
  // anything that uses the Runtime has shut down cleanly prior to global
  // destruction.
  static Runtime* runtime = new Runtime();
  return runtime;
}

void Runtime::ResetForTesting() {
  platform::lock_guard<platform::mutex> lock{mu_};
  thread_event_buffers_.clear();
  tasks_.clear();
}

EventBuffer* Runtime::PopTaskEventBuffer(const std::string& name) {
  int unique_id;
  EventBuffer* created;
  {
    platform::lock_guard<platform::mutex> lock{mu_};
    auto& task = tasks_[name];
    if (!task.idle_event_buffers.empty()) {
      EventBuffer* existing = task.idle_event_buffers.front();
      task.idle_event_buffers.pop_front();
      return existing;
    }
    unique_id = task.next_instance_id++;
    created = CreateThreadEventBuffer();
  }

  // Add uniquifier to the provided task name to make sure that
  // different threads don't get attributed to the same zone.
  std::ostringstream ss;
  ss << name << ":" << unique_id;
  std::string unique_name = ss.str();
  int zone_id =
      ZoneRegistry::GetInstance()->CreateZone(unique_name.c_str(), "TASK", "");
  StandardEvents::SetZone(created, zone_id);
  created->FreezePrefixSlots();

  return created;
}

void Runtime::PushTaskEventBuffer(const std::string& name,
                                  EventBuffer* event_buffer) {
  if (!event_buffer) {
    return;
  }

  platform::lock_guard<platform::mutex> lock{mu_};
  auto& task = tasks_[name];
  task.idle_event_buffers.push_front(event_buffer);
}

EventBuffer* Runtime::CreateThreadEventBuffer() {
  EventBuffer* r;
  thread_event_buffers_.emplace_back(r = new EventBuffer());
  return r;
}

void Runtime::EnableCurrentThread(const char* thread_name, const char* type,
                                  const char* location) {
  if (PlatformGetThreadLocalEventBuffer()) {
    return;
  }
  EventBuffer* event_buffer =
      RegisterExternalThread(thread_name, type, location);
  PlatformSetThreadLocalEventBuffer(event_buffer);
}

EventBuffer* Runtime::RegisterExternalThread(const char* thread_name,
                                             const char* type,
                                             const char* location) {
  EventBuffer* event_buffer;
  int unique_id;
  {
    platform::lock_guard<platform::mutex> lock{mu_};
    event_buffer = CreateThreadEventBuffer();
    unique_id = uniquifier_++;
  }
  // Add uniquifier to the provided thread name to make sure that
  // different threads don't get attributed to the same zone.
  std::ostringstream ss;
  ss << unique_id << ":" << thread_name;
  std::string unique_name = ss.str();
  int zone_id = ZoneRegistry::GetInstance()->CreateZone(unique_name.c_str(),
                                                        type, location);
  StandardEvents::SetZone(event_buffer, zone_id);
  event_buffer->FreezePrefixSlots();
  return event_buffer;
}

void Runtime::DisableCurrentThread() {
  PlatformSetThreadLocalEventBuffer(nullptr);
}

bool Runtime::SaveToFile(const std::string& file_name,
                         const SaveOptions& save_options) {
  std::fstream out;
  auto mode = save_options.open_mode | std::ios_base::out;
  out.open(file_name, mode);
  if (out.fail()) {
    return false;
  }

  bool append = (mode & std::ios_base::app) ? true : false;

  // If the file was deleted out from under us, reset the checkpoint.
  if (append && save_options.checkpoint && out.tellp() == std::streampos(0)) {
    *save_options.checkpoint = SaveCheckpoint{};
  }

  bool success = wtf::Runtime::GetInstance()->Save(&out, save_options);
  out.close();
  return success && !out.fail();
}

bool Runtime::Save(std::ostream* out, const SaveOptions& save_options) {
  SaveCheckpoint* checkpoint = save_options.checkpoint;
  bool needs_file_header = true;

  if (checkpoint) {
    needs_file_header = checkpoint->needs_file_header;
    checkpoint->needs_file_header = false;
  }

  // Make a copy of the thread event buffers in a lock. The rest can run
  // lock free.
  std::vector<EventBuffer*> local_thread_event_buffers;
  {
    platform::lock_guard<platform::mutex> lock{mu_};
    local_thread_event_buffers.reserve(thread_event_buffers_.size());
    for (auto& event_buffer : thread_event_buffers_) {
      local_thread_event_buffers.push_back(event_buffer.get());
    }
  }

  OutputBuffer output_buffer{out};

  if (needs_file_header) {
    WriteFileHeaderChunk(&output_buffer);
  }

  // Accumulate headers for each thread.
  std::vector<EventSnapshot> thread_snapshots;
  thread_snapshots.resize(local_thread_event_buffers.size());
  for (size_t i = 0; i < local_thread_event_buffers.size(); i++) {
    auto& snapshot = thread_snapshots[i];
    snapshot.event_buffer = local_thread_event_buffers[i];
    snapshot.event_buffer->PopulateHeader(&snapshot.event_buffer_header);
    // String table must be snapshotted after the EventBuffer so that it
    // contains at least as many strings have been referenced.
    snapshot.event_buffer->string_table()->PopulateHeader(
        &snapshot.string_table_header);
  }

  // Populate the EventBuffer of event registrations. This is done after all
  // events have been snapshotted to make sure we got everything.
  EventSnapshot definition_snapshot;
  EventBuffer definition_buffer;
  definition_snapshot.event_buffer = &definition_buffer;

  // Write new event definitions.
  size_t event_definition_from_index =
      checkpoint ? checkpoint->event_definition_from_index_ : 0;
  auto event_definitions = EventRegistry::GetInstance()->GetEventDefinitions(
      event_definition_from_index);
  std::string tmp_name;
  std::string tmp_arguments;
  for (auto& event_definition : event_definitions) {
    tmp_name.clear();
    tmp_arguments.clear();
    event_definition.AppendName(&tmp_name);
    event_definition.AppendArguments(&tmp_arguments);
    StandardEvents::DefineEvent(
        &definition_buffer, event_definition.wire_id(),
        static_cast<uint16_t>(event_definition.event_class()),
        event_definition.flags(), tmp_name.c_str(), tmp_arguments.c_str());
  }

  // Write new zone definitions.
  size_t zone_definition_from_index =
      checkpoint ? checkpoint->zone_definition_from_index_ : 0;
  zone_definition_from_index = ZoneRegistry::GetInstance()->EmitZones(
      &definition_buffer, zone_definition_from_index);

  // Populate the header for the definition buffer.
  definition_buffer.PopulateHeader(&definition_snapshot.event_buffer_header);
  definition_buffer.string_table()->PopulateHeader(
      &definition_snapshot.string_table_header);

  // Write the definition snapshot followed by each thread.
  bool success = WriteEventChunk(&output_buffer, &definition_snapshot, false);
  for (auto& thread_snapshot : thread_snapshots) {
    success = success && WriteEventChunk(&output_buffer, &thread_snapshot,
                                         save_options.clear_thread_data);
  }

  if (out->fail()) {
    success = false;
  }

  // Advance the checkpoint, if available.
  if (success && checkpoint) {
    checkpoint->event_definition_from_index_ =
        event_definition_from_index + event_definitions.size();
    checkpoint->zone_definition_from_index_ = zone_definition_from_index;
  }

  return success;
}

void Runtime::ClearThreadData() {
  // Make a copy of the thread event buffers in a lock. The rest can run
  // lock free.
  std::vector<EventBuffer*> local_thread_event_buffers;
  {
    platform::lock_guard<platform::mutex> lock{mu_};
    local_thread_event_buffers.reserve(thread_event_buffers_.size());
    for (auto& event_buffer : thread_event_buffers_) {
      local_thread_event_buffers.push_back(event_buffer.get());
    }
  }

  for (auto event_buffer : local_thread_event_buffers) {
    // Do a dummy write and clear.
    OutputBuffer::PartHeader header;
    event_buffer->PopulateHeader(&header);
    event_buffer->WriteTo(&header, nullptr, true);
  }
}

}  // namespace wtf
