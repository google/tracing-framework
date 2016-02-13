#include "wtf/event.h"

#include <algorithm>
#include <cstdio>
#include <cstring>

namespace wtf {

platform::atomic<int> EventDefinition::next_event_id_{
    StandardEvents::kScopeLeaveEventId + 1};

namespace {
bool IsSepCharOrNull(char c) {
  return c <= ' ' || c == ',';  // Note: Explicitly matches null.
}

// Scans for the next argument name in a list of identifiers separated by
// separator characters. Returns true if found and sets *out_arg_name and
// *out_len to point to the name and its length (it may not be zero terminated).
// Also advances *arg_names to one past the end of the argument name or nullptr
// if at the end.
bool PeelArgName(const char** arg_names, const char** out_arg_name,
                 size_t* out_len) {
  const char* arg_name = *arg_names;
  if (!arg_name || !*arg_name) {
    return false;
  }

  while (IsSepCharOrNull(*arg_name)) {
    if (*arg_name == 0) {
      // Hit the end of the string searching for end of trailing white-space.
      *arg_names = nullptr;
      return false;
    }
    arg_name += 1;
  }

  // arg_name now points to the beginning of the name.
  size_t len = 1;
  while (!IsSepCharOrNull(arg_name[len])) {
    len += 1;
  }

  // Output results.
  *arg_names = arg_name + len;
  *out_arg_name = arg_name;
  *out_len = len;
  return true;
}
}  // namespace

void EventDefinition::AppendName(std::string* output) const {
  const char* colon = strchr(name_spec_, ':');
  if (colon) {
    output->append(name_spec_, (colon - name_spec_));
  } else {
    output->append(name_spec_);
  }
}

void EventDefinition::AppendArguments(std::string* output) const {
  if (argument_zipper_ && name_spec_) {
    const char* arg_names = strchr(name_spec_, ':');
    if (arg_names) {
      // Colon found - advance.
      arg_names += 1;
    }
    argument_zipper_(output, arg_names);
  }
}

void EventDefinition::ZipArgument(std::string* output, size_t index,
                                  const char* next_arg_type,
                                  const char** arg_names) {
  if (output->size()) {
    output->append(", ");
  }
  output->append(next_arg_type);
  output->push_back(' ');

  // Output the name.
  const char* arg_name;
  size_t len;
  if (PeelArgName(arg_names, &arg_name, &len)) {
    output->append(arg_name, len);
  } else {
    // Generate one.
    char tmp_name[16];
    snprintf(tmp_name, sizeof(tmp_name), "a%zu", index);
    tmp_name[sizeof(tmp_name) - 1] = 0;  // Overflow guard.
    output->append(tmp_name);
  }
}

EventRegistry::EventRegistry() = default;

EventRegistry* EventRegistry::GetInstance() {
  static EventRegistry* instance = new EventRegistry();
  return instance;
}

void EventRegistry::AddEventDefinition(EventDefinition event_definition) {
  EventRegistry* instance = GetInstance();
  platform::lock_guard<platform::mutex> lock{instance->mu_};
  instance->event_definitions_.push_back(event_definition);
}

std::vector<EventDefinition> EventRegistry::GetEventDefinitions(
    size_t from_index) {
  platform::lock_guard<platform::mutex> lock{mu_};
  if (from_index >= event_definitions_.size()) {
    return std::vector<EventDefinition>{};
  }

  std::vector<EventDefinition> r;
  r.reserve(event_definitions_.size() - from_index);
  std::copy(event_definitions_.begin() + from_index, event_definitions_.end(),
            std::back_inserter(r));
  return r;
}

EventEnabled<>& StandardEvents::GetScopeLeaveEvent() {
  static EventEnabled<> event{kScopeLeaveEventId, EventClass::kInstance,
                              EventFlags::kBuiltin | EventFlags::kInternal,
                              "wtf.scope#leave"};
  return event;
}

void StandardEvents::DefineEvent(EventBuffer* event_buffer, uint16_t wire_id,
                                 uint16_t event_class, uint32_t flags,
                                 const char* name, const char* args) {
  static EventEnabled<uint16_t, uint16_t, uint32_t, const char*, const char*>
      event{1, EventClass::kInstance,
            EventFlags::kBuiltin | EventFlags::kInternal,
            "wtf.event#define:wireId,eventClass,flags,name,args"};
  event.InvokeSpecific(event_buffer, wire_id, event_class, flags, name, args);
}

void StandardEvents::ScopeLeave(EventBuffer* event_buffer) {
  GetScopeLeaveEvent().InvokeSpecific(event_buffer);
}

int StandardEvents::CreateZone(EventBuffer* event_buffer, const char* name,
                               const char* type, const char* location) {
  static platform::atomic<int> next_zone_id{1};
  static EventEnabled<uint16_t, const char*, const char*, const char*> event{
      EventClass::kInstance, EventFlags::kBuiltin | EventFlags::kInternal,
      "wtf.zone#create:zoneId,name,type,location"};
  int zone_id = next_zone_id.fetch_add(1);
  event.InvokeSpecific(event_buffer, zone_id, name, type, location);
  return zone_id;
}

void StandardEvents::SetZone(EventBuffer* event_buffer, int zone_id) {
  static EventEnabled<uint16_t> event{
      EventClass::kInstance, EventFlags::kBuiltin | EventFlags::kInternal,
      "wtf.zone#set:zoneId"};
  event.InvokeSpecific(event_buffer, zone_id);
}

void StandardEvents::FrameStart(EventBuffer* event_buffer, uint32_t number) {
  static EventEnabled<uint32_t> event{EventClass::kInstance,
                                      EventFlags::kInternal,
                                      "wtf.timing#frameStart:number"};
  event.InvokeSpecific(event_buffer, number);
}

void StandardEvents::FrameEnd(EventBuffer* event_buffer, uint32_t number) {
  static EventEnabled<uint32_t> event{EventClass::kInstance,
                                      EventFlags::kInternal,
                                      "wtf.timing#frameEnd:number"};
  event.InvokeSpecific(event_buffer, number);
}

}  // namespace wtf
