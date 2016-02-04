// Defines ArgTypeDef specialization for all fundamental types.
#ifndef TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_ARGTYPES_H_
#define TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_ARGTYPES_H_

#include <string>

#include "wtf/buffer.h"

namespace wtf {
namespace types {

// ArgTypeDef for each supported type provides the WTF type name and a
// function for emitting values of the type.
template <typename ArgType>
struct ArgTypeDef {
  static const size_t kSlotCount = 0;
  static const char* type_name() { return "unknown"; }
  static void Emit(EventBuffer* b, uint32_t* slots, ArgType value) {}
};

// const char* -> ascii
template <>
struct ArgTypeDef<const char*> {
  static const size_t kSlotCount = 1;
  static const char* type_name() { return "ascii"; }
  static void Emit(EventBuffer* b, uint32_t* slots, const char* value) {
    int string_id = value ? b->string_table()->GetStringId(value)
                          : StringTable::kEmptyStringId;
    slots[0] = string_id;
  }
};

// const std::string -> ascii
template <>
struct ArgTypeDef<const std::string> {
  static const size_t kSlotCount = 1;
  static const char* type_name() { return "ascii"; }
  static void Emit(EventBuffer* b, uint32_t* slots, const std::string& value) {
    int string_id = value.empty()
                        ? StringTable::kEmptyStringId
                        : b->string_table()->GetStringId(value.c_str());
    slots[0] = string_id;
  }
};

template <typename T>
struct Base32BitIntegralArgTypeDef {
  static const size_t kSlotCount = 1;
  static void Emit(EventBuffer* b, uint32_t* slots, T value) {
    slots[0] = static_cast<uint32_t>(value);
  }
};

// uint8_t -> uint8
template <>
struct ArgTypeDef<uint8_t> : Base32BitIntegralArgTypeDef<uint8_t> {
  static const char* type_name() { return "uint8"; }
};

// uint16_t -> uint16
template <>
struct ArgTypeDef<uint16_t> : Base32BitIntegralArgTypeDef<uint16_t> {
  static const char* type_name() { return "uint16"; }
};

// uint32_t -> uint32
template <>
struct ArgTypeDef<uint32_t> : Base32BitIntegralArgTypeDef<uint32_t> {
  static const char* type_name() { return "uint32"; }
};

// int8_t -> int8
template <>
struct ArgTypeDef<int8_t> : Base32BitIntegralArgTypeDef<int8_t> {
  static const char* type_name() { return "int8"; }
};

// int16_t -> int16
template <>
struct ArgTypeDef<int16_t> : Base32BitIntegralArgTypeDef<int16_t> {
  static const char* type_name() { return "int16"; }
};

// int32_t -> int32
template <>
struct ArgTypeDef<int32_t> : Base32BitIntegralArgTypeDef<int32_t> {
  static const char* type_name() { return "int32"; }
};

template <typename T>
struct Base64BitIntegralArgTypeDef {
  // TODO(laurenzo): WTF does not natively support 64 bit types. We just
  // truncate them until fixed.
  static const size_t kSlotCount = 1;
  static void Emit(EventBuffer* b, uint32_t* slots, T value) {
    slots[0] = static_cast<uint32_t>(value);
  }
};

// uint64_t -> uint32
template <>
struct ArgTypeDef<uint64_t> : Base64BitIntegralArgTypeDef<uint64_t> {
  static const char* type_name() { return "uint32"; }
};

// int64_t -> int32
template <>
struct ArgTypeDef<int64_t> : Base64BitIntegralArgTypeDef<int64_t> {
  static const char* type_name() { return "int32"; }
};

// float -> float32
template <>
struct ArgTypeDef<float> {
  static const char* type_name() { return "float32"; }
  static const size_t kSlotCount = 1;
  static void Emit(EventBuffer* b, uint32_t* slots, float value) {
    union {
      float float_value;
      uint32_t slot_value;
    } alias;
    alias.float_value = value;
    slots[0] = alias.slot_value;
  }
};

// bool -> bool
template <>
struct ArgTypeDef<bool> {
  static const char* type_name() { return "bool"; }
  static const size_t kSlotCount = 1;
  static void Emit(EventBuffer* b, uint32_t* slots, bool value) {
    slots[0] = value ? 1 : 0;
  }
};

// Does a compile time assert that the type is supported.
template <typename T>
struct AssertTypeDef {
  static constexpr bool Assert() {
    static_assert(ArgTypeDef<T>::kSlotCount > 0,
                  "WTF does not support arguments of this type");
    return true;
  }
};

}  // namespace types
}  // namespace wtf

#endif  // TRACING_FRAMEWORK_BINDINGS_CPP_INCLUDE_ARGTYPES_H_
