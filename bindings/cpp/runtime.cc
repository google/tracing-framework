#include "wtf/runtime.h"

#include <cstdint>
#include <fstream>

#include "jsoncpp/json/json.h"

namespace wtf {

Runtime::Runtime() {
  PlatformInitialize();

  // Force reference event types that we inline manually.
  StandardEvents::GetScopeLeaveEvent();
}

Runtime* Runtime::GetInstance() {
  static Runtime runtime;
  return &runtime;
}

void Runtime::ResetForTesting() {
  thread_event_buffers_.clear();
  shared_string_table_.Clear();
}

EventBuffer* Runtime::CreateThreadEventBuffer() {
  EventBuffer* r;
  thread_event_buffers_.emplace_back(
      r = new EventBuffer(&shared_string_table_));
  return r;
}

void Runtime::EnableCurrentThread(const char* thread_name, const char* type,
                                  const char* location) {
  if (PlatformGetThreadLocalEventBuffer()) {
    return;
  }
  EventBuffer* event_buffer;
  {
    std::lock_guard<std::mutex> lock{mu_};
    event_buffer = CreateThreadEventBuffer();
  }

  int zone_id =
      StandardEvents::CreateZone(event_buffer, thread_name, type, location);
  StandardEvents::SetZone(event_buffer, zone_id);
  PlatformSetThreadLocalEventBuffer(event_buffer);
}

void Runtime::DisableCurrentThread() {
  PlatformSetThreadLocalEventBuffer(nullptr);
}

void Runtime::WriteHeaderChunk(OutputBuffer* output_buffer) {
  static const uint32_t kMagicNumber = 0xdeadbeef;
  static const uint32_t kWtfVersion = 0xe8214400;
  static const uint32_t kFormatVersion = 10;

  // File header words.
  output_buffer->AppendUint32(kMagicNumber);
  output_buffer->AppendUint32(kWtfVersion);
  output_buffer->AppendUint32(kFormatVersion);

  // Header chunk.
  Json::Value flags(Json::arrayValue);
  flags.append("has_high_resolution_times");

  Json::Value context(Json::objectValue);
  context["contextType"] = "script";
  context["title"] = "Generic Trace";

  Json::Value json;
  json["type"] = "file_header";
  json["flags"] = flags;
  json["timebase"] = 0;  // We reset the platform to a 0 time base ourselves.
  json["contextInfo"] = context;

  Json::FastWriter json_writer;
  auto json_string = json_writer.write(json);

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

bool Runtime::SaveToFile(const std::string& file_name) {
  std::fstream out;
  out.open(file_name, std::ios_base::out | std::ios_base::trunc);
  if (out.fail()) {
    return false;
  }
  bool success = wtf::Runtime::GetInstance()->Save(&out);
  out.close();
  return success && !out.fail();
}

bool Runtime::Save(std::ostream* out) {
  // Make a copy of the thread event buffers in a lock. The rest can run
  // lock free.
  std::vector<EventBuffer*> local_thread_event_buffers;
  {
    std::lock_guard<std::mutex> lock{mu_};
    local_thread_event_buffers.reserve(thread_event_buffers_.size());
    for (auto& event_buffer : thread_event_buffers_) {
      local_thread_event_buffers.push_back(event_buffer.get());
    }
  }

  OutputBuffer output_buffer{out};
  WriteHeaderChunk(&output_buffer);

  // There will be two parts: string and event. The event part is actually
  // a merged combination of the meta event + each thread event.
  const size_t kPartCount = 2;
  OutputBuffer::PartHeader part_headers[kPartCount];
  OutputBuffer::PartHeader* strings_header = &part_headers[0];
  OutputBuffer::PartHeader* events_header = &part_headers[1];

  // Accumulate headers for each thread.
  std::vector<OutputBuffer::PartHeader> thread_part_headers;
  thread_part_headers.resize(local_thread_event_buffers.size());
  size_t thread_parts_length = 0;
  for (size_t i = 0; i < local_thread_event_buffers.size(); i++) {
    auto thread_part_header = &thread_part_headers[i];
    local_thread_event_buffers[i]->PopulateHeader(thread_part_header);
    thread_parts_length += thread_part_header->length;
  }

  // Populate the EventBuffer of event registrations. This is done after all
  // events have been snapshotted to make sure we got everything.
  OutputBuffer::PartHeader event_def_header;
  auto event_definitions = EventRegistry::GetInstance()->GetEventDefinitions();
  EventBuffer event_def_buffer{&shared_string_table_};
  std::string tmp_name;
  std::string tmp_arguments;
  for (auto& event_definition : event_definitions) {
    tmp_name.clear();
    tmp_arguments.clear();
    event_definition.AppendName(&tmp_name);
    event_definition.AppendArguments(&tmp_arguments);
    StandardEvents::DefineEvent(
        &event_def_buffer, event_definition.wire_id(),
        static_cast<uint16_t>(event_definition.event_class()),
        event_definition.flags(), tmp_name.c_str(), tmp_arguments.c_str());
  }
  event_def_buffer.PopulateHeader(&event_def_header);

  // Create the combined events header that consists of the event definition
  // buffer + each thread buffer.
  *events_header = event_def_header;
  events_header->length += thread_parts_length;

  // Must populate the strings header last so that we get all strings that
  // may have been referenced (note specifically that processing event
  // registrations adds strings).
  shared_string_table_.PopulateHeader(strings_header);

  // Setup the chunk.
  OutputBuffer::ChunkHeader chunk_header{
      2,                               // Id.
      0x2,                             // Type = Events.
      0,                               // Start time.
      PlatformGetTimestampMicros32(),  // End time.
  };
  output_buffer.StartChunk(chunk_header, part_headers, kPartCount);

  // And write each part. Order must match header order in part_headers.
  bool success = true;
  success =
      shared_string_table_.WriteTo(strings_header, &output_buffer) && success;
  success =
      event_def_buffer.WriteTo(&event_def_header, &output_buffer) && success;
  for (size_t i = 0; i < local_thread_event_buffers.size(); i++) {
    success = local_thread_event_buffers[i]->WriteTo(&thread_part_headers[i],
                                                     &output_buffer) &&
              success;
  }

  return success && !out->fail();
}

}  // namespace wtf
