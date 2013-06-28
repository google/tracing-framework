namespace wtf {

WTF_INSTANCE_EVENT(
    DefineEvent,
    "wtf.event#define(uint16 wireId, uint16 eventClass, uint32 flags, ascii name, ascii args)",
    wtf::EventFlag::BuiltIn | wtf::EventFlag::Internal,
    5, uint16_t, uint16_t, uint32_t, std::string&, std::string&);
WTF_INSTANCE_EVENT(
    Discontinuity,
    "wtf.trace#discontinuity()",
    wtf::EventFlag::BuiltIn,
    0);
WTF_INSTANCE_EVENT(
    CreateZone,
    "wtf.zone#create(uint16 zoneId, ascii name, ascii type, ascii location)",
    wtf::EventFlag::BuiltIn | wtf::EventFlag::Internal,
    4, uint16_t, std::string&, std::string&, std::string&);
WTF_INSTANCE_EVENT(
    DeleteZone,
    "wtf.zone#delete(uint16 zoneId)",
    wtf::EventFlag::BuiltIn | wtf::EventFlag::Internal,
    1, uint16_t);
WTF_INSTANCE_EVENT(
    SetZone,
    "wtf.zone#set(uint16 zoneId)",
    wtf::EventFlag::BuiltIn | wtf::EventFlag::Internal,
    1, uint16_t);
WTF_SCOPE_EVENT(
    EnterScope,
    "wtf.scope#enter(ascii name)",
    wtf::EventFlag::BuiltIn,
    1, std::string&);
WTF_SCOPE_EVENT(
    EnterTracingScope,
    "wtf.scope#enterTracing()",
    wtf::EventFlag::BuiltIn | wtf::EventFlag::Internal |
    wtf::EventFlag::SystemTime,
    0);
WTF_INSTANCE_EVENT(
    LeaveScope,
    "wtf.scope.leave()",
    wtf::EventFlag::BuiltIn | wtf::EventFlag::Internal |
        wtf::EventFlag::HighFrequency,
    0);

}  // namespace wtf


namespace my {
namespace events {

WTF_INSTANCE_EVENT(
    MyInstanceEventUI,
    "my#instanceEventUI(uint32 i)",
    0,
    1, uint32_t);

WTF_INSTANCE_EVENT(
    MyInstanceEventAscii,
    "my#instanceEventUI(ascii s)",
    0,
    1, const char*);

WTF_INSTANCE_EVENT(
    MyInstanceEventUtf8,
    "my#instanceEventUI(utf8 s)",
    0,
    1, const wchar_t*);

WTF_INSTANCE_EVENT(
    MyInstanceEventBytes,
    "my#instanceEventUI(uint32 i, uint8[] bytes)",
    0,
    2, uint32_t, wtf::Int8Array*);

WTF_SCOPE_EVENT(
    MyScopeEvent,
    "my#scopeEvent(float32 f, uint32_t i)",
    0,
    2, float, uint32_t);

}  // namespace events
}  // namespace my
