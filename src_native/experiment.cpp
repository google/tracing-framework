#if defined(WIN32)
#include <SDKDDKVer.h>
#include <tchar.h>
#endif

#include <typeinfo>
#include <stdint.h>
#include <limits.h>
#include <assert.h>
#include <vector>
#include <stdlib.h>
#include <string.h>
#include <string>
#include <stdio.h>

namespace wtf {

static uint64_t timebase() {
  return 0;
}
static uint32_t now() {
  return 0;
}

template <typename T>
class TypedArray {
public:
  TypedArray(const T* elements, const size_t length)
      : elements_(elements), length_(length) {}

  const T* elements() const { return elements_; }
  const size_t length() const { return length_; }

private:
  const T* elements_;
  const size_t length_;
};

class Int8Array : public TypedArray<int8_t> {
public:
  Int8Array(const int8_t* elements, const size_t length)
      : TypedArray<int8_t>(elements, length) {}
};
class Uint8Array : public TypedArray<uint8_t> {
public:
  Uint8Array(const uint8_t* elements, const size_t length)
      : TypedArray<uint8_t>(elements, length) {}
};
class Int16Array : public TypedArray<int16_t> {
public:
  Int16Array(const int16_t* elements, const size_t length)
      : TypedArray<int16_t>(elements, length) {}
};
class Uint16Array : public TypedArray<uint16_t> {
public:
  Uint16Array(const uint16_t* elements, const size_t length)
      : TypedArray<uint16_t>(elements, length) {}
};
class Int32Array : public TypedArray<int32_t> {
public:
  Int32Array(const int32_t* elements, const size_t length)
      : TypedArray<int32_t>(elements, length) {}
};
class Uint32Array : public TypedArray<uint32_t> {
public:
  Uint32Array(const uint32_t* elements, const size_t length)
      : TypedArray<uint32_t>(elements, length) {}
};
class Float32Array : public TypedArray<float> {
public:
  Float32Array(const float* elements, const size_t length)
      : TypedArray<float>(elements, length) {}
};

class StringTable {
public:
  StringTable() {}
  ~StringTable() {}

  void Reset() {
    entries_.clear();
  }

  uint32_t Add(const char* value) {
    entries_.push_back(Entry(value));
    return entries_.size() - 1;
  }

  uint32_t Add(const wchar_t* value) {
    entries_.push_back(Entry(value));
    return entries_.size() - 1;
  }

private:
  struct Entry {
    enum Format {
      kFormatChar = 0,
      kFormatWchar = 1,
    };

    Format        format;
    const void*   value;

    Entry(const char* source_value)
        : format(kFormatChar), value(source_value) {}
    Entry(const wchar_t* source_value)
        : format(kFormatWchar), value(source_value) {}
  };

  std::vector<Entry> entries_;
};

class Buffer {
public:
  Buffer(const size_t length) : length_(length), offset_(0), storage_(NULL) {}
  virtual ~Buffer() {}

  void Reset() {
    offset_ = 0;
    string_table_.Reset();
  }

  bool HasAvailable(const size_t requested_length) const {
    return length_ - offset_ >= requested_length;
  }

protected:
  void Init(uint8_t* storage) {
    storage_ = storage;
  }

  const size_t  length_;
  size_t        offset_;
  uint8_t*      storage_;
  StringTable   string_table_;

public:
  template <typename T>
  static size_t ComputeSize(const T value) {
    return 4;
  }

public:
  template <typename T>
  void Write(const T value) {
    assert(false);
  }

private:
  void WriteArray(const void* elements,
                  const size_t length,
                  const size_t element_size) {
    const size_t total_bytes = length * element_size;
    *reinterpret_cast<uint32_t*>(storage_ + offset_) = length;
    memcpy(storage_ + offset_ + 4, elements, total_bytes);
    offset_ += 4 + (total_bytes + 3) & ~0x3;
  }
};

template <>
size_t Buffer::ComputeSize(Int8Array* value) {
  return 4 + value ? ((value->length() + 3) & ~0x3) : 0;
}
template <>
size_t Buffer::ComputeSize(Uint8Array* value) {
  return 4 + value ? ((value->length() + 3) & ~0x3) : 0;
}
template <>
size_t Buffer::ComputeSize(Int16Array* value) {
  return 4 + value ? (((value->length() + 1) * 2) & ~0x3) : 0;
}
template <>
size_t Buffer::ComputeSize(Uint16Array* value) {
  return 4 + value ? (((value->length() + 1) * 2) & ~0x3) : 0;
}
template <>
size_t Buffer::ComputeSize(Int32Array* value) {
  return 4 + value ? (value->length() * 4) : 0;
}
template <>
size_t Buffer::ComputeSize(Uint32Array* value) {
  return 4 + value ? (value->length() * 4) : 0;
}
template <>
size_t Buffer::ComputeSize(Float32Array* value) {
  return 4 + value ? (value->length() * 4) : 0;
}

template <>
void Buffer::Write<int8_t>(int8_t value) {
  printf("Write<int8_t>(%d)\n", value);
  *reinterpret_cast<int8_t*>(storage_ + offset_) = value;
  offset_ += 4;
}
template <>
void Buffer::Write<uint8_t>(uint8_t value) {
  printf("Write<uint8_t>(%d)\n", value);
  *reinterpret_cast<uint8_t*>(storage_ + offset_) = value;
  offset_ += 4;
}
template <>
void Buffer::Write<int16_t>(int16_t value) {
  printf("Write<int16_t>(%d)\n", value);
  *reinterpret_cast<int16_t*>(storage_ + offset_) = value;
  offset_ += 4;
}
template <>
void Buffer::Write<uint16_t>(uint16_t value) {
  printf("Write<uint16_t>(%d)\n", value);
  *reinterpret_cast<uint16_t*>(storage_ + offset_) = value;
  offset_ += 4;
}
template <>
void Buffer::Write<int32_t>(int32_t value) {
  printf("Write<int32_t>(%d)\n", value);
  *reinterpret_cast<int32_t*>(storage_ + offset_) = value;
  offset_ += 4;
}
template <>
void Buffer::Write<uint32_t>(uint32_t value) {
  printf("Write<uint32_t>(%d)\n", value);
  *reinterpret_cast<uint32_t*>(storage_ + offset_) = value;
  offset_ += 4;
}
template <>
void Buffer::Write<float>(float value) {
  printf("Write<float>(%g)\n", value);
  *reinterpret_cast<float*>(storage_ + offset_) = value;
  offset_ += 4;
}
template <>
void Buffer::Write<const char*>(const char* value) {
  printf("Write<char*>(%s)\n", value);
  uint32_t string_id;
  if (!value) {
    string_id = -1;
  } else if (value[0] == 0) {
    string_id = -2;
  } else {
    string_id = string_table_.Add(value);
  }
  *reinterpret_cast<uint32_t*>(storage_ + offset_) = string_id;
  offset_ += 4;
}
template <>
void Buffer::Write<char*>(char* value) {
  Write<const char*>(value);
}
template <>
void Buffer::Write<const wchar_t*>(const wchar_t* value) {
  printf("Write<wchar_t*>(%ls)\n", value);
  uint32_t string_id;
  if (!value) {
    string_id = -1;
  } else if (value[0] == 0) {
    string_id = -2;
  } else {
    string_id = string_table_.Add(value);
  }
  *reinterpret_cast<uint32_t*>(storage_ + offset_) = string_id;
  offset_ += 4;
}
template <>
void Buffer::Write<wchar_t*>(wchar_t* value) {
  Write<const wchar_t*>(value);
}

template <>
void Buffer::Write<Int8Array*>(Int8Array* value) {
  printf("Write<Int8Array>(len=%lu)\n", value->length());
  if (value) {
    WriteArray(value->elements(), value->length(), 1);
  } else {
    Write<uint32_t>(-1);
  }
}
template <>
void Buffer::Write<Uint8Array*>(Uint8Array* value) {
  printf("Write<Uint8Array>(len=%lu)\n", value->length());
  if (value) {
    WriteArray(value->elements(), value->length(), 1);
  } else {
    Write<uint32_t>(-1);
  }
}
template <>
void Buffer::Write<Int16Array*>(Int16Array* value) {
  printf("Write<Int16Array>(len=%lu)\n", value->length());
  if (value) {
    WriteArray(value->elements(), value->length(), 2);
  } else {
    Write<uint32_t>(-1);
  }
}
template <>
void Buffer::Write<Uint16Array*>(Uint16Array* value) {
  printf("Write<Uint16Array>(len=%lu)\n", value->length());
  if (value) {
    WriteArray(value->elements(), value->length(), 2);
  } else {
    Write<uint32_t>(-1);
  }
}
template <>
void Buffer::Write<Int32Array*>(Int32Array* value) {
  printf("Write<Int32Array>(len=%lu)\n", value->length());
  if (value) {
    WriteArray(value->elements(), value->length(), 4);
  } else {
    Write<uint32_t>(-1);
  }
}
template <>
void Buffer::Write<Uint32Array*>(Uint32Array* value) {
  printf("Write<Uint32Array>(len=%lu)\n", value->length());
  if (value) {
    WriteArray(value->elements(), value->length(), 4);
  } else {
    Write<uint32_t>(-1);
  }
}
template <>
void Buffer::Write<Float32Array*>(Float32Array* value) {
  printf("Write<Float32Array>(len=%lu)\n", value->length());
  if (value) {
    WriteArray(value->elements(), value->length(), 4);
  } else {
    Write<uint32_t>(-1);
  }
}

class MemoryBuffer : public Buffer {
public:
  MemoryBuffer(const size_t length) : Buffer(length) {
    Init(reinterpret_cast<uint8_t*>(calloc(1, length)));
  }

  virtual ~MemoryBuffer() {
    free(storage_);
  }
};

class Chunk {
public:
  Chunk(Buffer* buffer) : buffer_(buffer) {}

  Buffer* buffer() const {
    return buffer_;
  }

private:
  Buffer* buffer_;
};

class StreamTarget {
public:
  StreamTarget() {}
  virtual ~StreamTarget() {}

  virtual Chunk* AllocateChunk(const size_t minimum_capacity) = 0;
  virtual void RetireChunk(Chunk* chunk) = 0;
};

class MemoryStreamTarget : public StreamTarget {
public:
  MemoryStreamTarget() {}
  virtual ~MemoryStreamTarget() {
    for (std::vector<Chunk*>::iterator it = chunks_.begin();
        it != chunks_.end(); ++it) {
      delete *it;
    }
  }

  virtual Chunk* AllocateChunk(const size_t minimum_capacity) {
    Buffer* buffer = new MemoryBuffer(minimum_capacity);
    Chunk* chunk = new Chunk(buffer);
    return chunk;
  }

  virtual void RetireChunk(Chunk* chunk) {
    chunks_.push_back(chunk);
  }

private:
  std::vector<Chunk*> chunks_;
};

class FileStreamTarget : public StreamTarget {
public:
  FileStreamTarget(const char* path) {}
  virtual ~FileStreamTarget() {}

  virtual Chunk* AllocateChunk(const size_t minimum_capacity) {
    Buffer* buffer = new MemoryBuffer(minimum_capacity);
    Chunk* chunk = new Chunk(buffer);
    return chunk;
  }

  virtual void RetireChunk(Chunk* chunk) {
    delete chunk;
  }
};

class Session {
public:
  Session(StreamTarget* stream_target)
      : stream_target_(stream_target), current_chunk_(NULL),
        current_buffer_(NULL) {
    buffer_capacity_ = 16 * 1024 * 1024;
  }

  ~Session() {
    if (current_chunk_) {
      stream_target_->RetireChunk(current_chunk_);
    }
  }

  Buffer* AcquireBuffer(const size_t required_size) {
    // Fast check to see if we have a current buffer with enough space.
    // This is the 99% path and should (hopefully) be fast.
    if (current_buffer_) {
      if (current_buffer_->HasAvailable(required_size)) {
        return current_buffer_;
      }

      // Buffer is out of space - retire and get another.
      stream_target_->RetireChunk(current_chunk_);
      current_chunk_ = NULL;
      current_buffer_ = NULL;
    }

    // Allocate a new chunk.
    current_chunk_ = stream_target_->AllocateChunk(
        std::max(required_size, buffer_capacity_));
    current_buffer_ = current_chunk_->buffer();
    return current_buffer_;
  }

  static Session* current_session() {
    return current_session_;
  };

  static void Start(StreamTarget* stream_target) {
    assert(!current_session_);
    current_session_ = new Session(stream_target);
  }

  static void Stop() {
    assert(current_session_);
    delete current_session_;
    current_session_ = NULL;
  }

private:
  StreamTarget* stream_target_;
  size_t        buffer_capacity_;

  Chunk*        current_chunk_;
  Buffer*       current_buffer_;

  static Session* current_session_;
};
Session* Session::current_session_ = NULL;

class EventClass {
public:
  enum Value {
    Instance  = 0,
    Scope     = 1,
  };
};

class EventFlag {
public:
  enum Value {
    HighFrequency     = (1 << 1),
    SystemTime        = (1 << 2),
    Internal          = (1 << 3),
    AppendScopeData   = (1 << 4),
    BuiltIn           = (1 << 5),
    AppendFlowData    = (1 << 6),
  };
};

class Event {
public:
  Event(const char* signature, EventClass::Value event_class, uint32_t event_flags, uint32_t id) :
      signature_(signature), event_class_(event_class), event_flags_(event_flags),
      id_(id == UINT_MAX ? next_id_++ : id) {};
  uint32_t id() const {
    return id_;
  }
  const char* signature() const {
    return signature_;
  }
  EventClass::Value event_class() const {
    return event_class_;
  }
  uint32_t event_flags() const {
    return event_flags_;
  }

protected:
  const char* signature_;
  EventClass::Value event_class_;
  uint32_t event_flags_;
  uint32_t id_;

  static uint32_t next_id_;
};
// Start late so that we ensure system events go first.
uint32_t Event::next_id_ = 1000;

template <typename TANONE = uint32_t>
class TypedEvent0 : public Event {
public:
  TypedEvent0(const char* signature, EventClass::Value event_class,
              uint32_t event_flags, uint32_t id = UINT_MAX)
      : Event(signature, event_class, event_flags, id) {};
  void operator()() const {
    const uint32_t time = wtf::now();
    Session* session = Session::current_session();
    const size_t required_size = 4 + 4;
    Buffer* buffer = session->AcquireBuffer(required_size);
    buffer->Write<uint32_t>(id_);
    buffer->Write<uint32_t>(time);
  }
};

template <typename TA1>
class TypedEvent1 : public Event {
public:
  TypedEvent1(const char* signature, EventClass::Value event_class,
              uint32_t event_flags, uint32_t id = UINT_MAX)
      : Event(signature, event_class, event_flags, id) {};
  void operator()(TA1 arg1) const {
    const uint32_t time = wtf::now();
    Session* session = Session::current_session();
    const size_t required_size =
        4 + 4 + Buffer::ComputeSize<TA1>(arg1);
    Buffer* buffer = session->AcquireBuffer(required_size);
    buffer->Write<uint32_t>(id_);
    buffer->Write<uint32_t>(time);
    buffer->Write<TA1>(arg1);
  }
};

template <typename TA1, typename TA2>
class TypedEvent2 : public Event {
public:
  TypedEvent2(const char* signature, EventClass::Value event_class,
              uint32_t event_flags, uint32_t id = UINT_MAX)
      : Event(signature, event_class, event_flags, id) {};
  void operator()(TA1 arg1, TA2 arg2) const {
    const uint32_t time = wtf::now();
    Session* session = Session::current_session();
    const size_t required_size =
        4 + 4 + Buffer::ComputeSize<TA1>(arg1) +
                Buffer::ComputeSize<TA2>(arg2);
    Buffer* buffer = session->AcquireBuffer(required_size);
    buffer->Write<uint32_t>(id_);
    buffer->Write<uint32_t>(time);
    buffer->Write<TA1>(arg1);
    buffer->Write<TA2>(arg2);
  }
};

template <typename TA1, typename TA2, typename TA3>
class TypedEvent3 : public Event {
public:
  TypedEvent3(const char* signature, EventClass::Value event_class,
              uint32_t event_flags, uint32_t id = UINT_MAX)
      : Event(signature, event_class, event_flags, id) {};
  void operator()(TA1 arg1, TA2 arg2, TA3 arg3) const {
    const uint32_t time = wtf::now();
    Session* session = Session::current_session();
    const size_t required_size =
        4 + 4 + Buffer::ComputeSize<TA1>(arg1) +
                Buffer::ComputeSize<TA2>(arg2) +
                Buffer::ComputeSize<TA3>(arg3);
    Buffer* buffer = session->AcquireBuffer(required_size);
    buffer->Write<uint32_t>(id_);
    buffer->Write<uint32_t>(time);
    buffer->Write<TA1>(arg1);
    buffer->Write<TA2>(arg2);
    buffer->Write<TA3>(arg3);
  }
};

template <typename TA1, typename TA2, typename TA3, typename TA4>
class TypedEvent4 : public Event {
public:
  TypedEvent4(const char* signature, EventClass::Value event_class,
              uint32_t event_flags, uint32_t id = UINT_MAX)
      : Event(signature, event_class, event_flags, id) {};
  void operator()(TA1 arg1, TA2 arg2, TA3 arg3, TA4 arg4) const {
    const uint32_t time = wtf::now();
    Session* session = Session::current_session();
    const size_t required_size =
        4 + 4 + Buffer::ComputeSize<TA1>(arg1) +
                Buffer::ComputeSize<TA2>(arg2) +
                Buffer::ComputeSize<TA3>(arg3) +
                Buffer::ComputeSize<TA4>(arg4);
    Buffer* buffer = session->AcquireBuffer(required_size);
    buffer->Write<uint32_t>(id_);
    buffer->Write<uint32_t>(time);
    buffer->Write<TA1>(arg1);
    buffer->Write<TA2>(arg2);
    buffer->Write<TA3>(arg3);
    buffer->Write<TA4>(arg4);
  }
};

template <typename TA1, typename TA2, typename TA3, typename TA4, typename TA5>
class TypedEvent5 : public Event {
public:
  TypedEvent5(const char* signature, EventClass::Value event_class,
              uint32_t event_flags, uint32_t id = UINT_MAX)
      : Event(signature, event_class, event_flags, id) {};
  void operator()(TA1 arg1, TA2 arg2, TA3 arg3, TA4 arg4, TA5 arg5) const {
    const uint32_t time = wtf::now();
    Session* session = Session::current_session();
    const size_t required_size =
        4 + 4 + Buffer::ComputeSize<TA1>(arg1) +
                Buffer::ComputeSize<TA2>(arg2) +
                Buffer::ComputeSize<TA3>(arg3) +
                Buffer::ComputeSize<TA4>(arg4) +
                Buffer::ComputeSize<TA5>(arg5);
    Buffer* buffer = session->AcquireBuffer(required_size);
    buffer->Write<uint32_t>(id_);
    buffer->Write<uint32_t>(time);
    buffer->Write<TA1>(arg1);
    buffer->Write<TA2>(arg2);
    buffer->Write<TA3>(arg3);
    buffer->Write<TA4>(arg4);
    buffer->Write<TA5>(arg5);
  }
};

template <typename TA1, typename TA2, typename TA3, typename TA4, typename TA5,
          typename TA6>
class TypedEvent6 : public Event {
public:
  TypedEvent6(const char* signature, EventClass::Value event_class,
              uint32_t event_flags, uint32_t id = UINT_MAX)
      : Event(signature, event_class, event_flags, id) {};
  void operator()(TA1 arg1, TA2 arg2, TA3 arg3, TA4 arg4, TA5 arg5,
                  TA6 arg6) const {
    const uint32_t time = wtf::now();
    Session* session = Session::current_session();
    const size_t required_size =
        4 + 4 + Buffer::ComputeSize<TA1>(arg1) +
                Buffer::ComputeSize<TA2>(arg2) +
                Buffer::ComputeSize<TA3>(arg3) +
                Buffer::ComputeSize<TA4>(arg4) +
                Buffer::ComputeSize<TA5>(arg5) +
                Buffer::ComputeSize<TA6>(arg6);
    Buffer* buffer = session->AcquireBuffer(required_size);
    buffer->Write<uint32_t>(id_);
    buffer->Write<uint32_t>(time);
    buffer->Write<TA1>(arg1);
    buffer->Write<TA2>(arg2);
    buffer->Write<TA3>(arg3);
    buffer->Write<TA4>(arg4);
    buffer->Write<TA5>(arg5);
    buffer->Write<TA6>(arg6);
  }
};

namespace TL {
class NullType {};

template <class T, class U>
struct Typelist {
  typedef T Head;
  typedef U Tail;
};
template<
  typename T1  = NullType, typename T2  = NullType, typename T3  = NullType,
  typename T4  = NullType, typename T5  = NullType, typename T6  = NullType,
  typename T7  = NullType, typename T8  = NullType, typename T9  = NullType,
  typename T10 = NullType, typename T11 = NullType, typename T12 = NullType,
  typename T13 = NullType, typename T14 = NullType, typename T15 = NullType,
  typename T16 = NullType, typename T17 = NullType, typename T18 = NullType>
struct MakeTypelist {
private:
  typedef typename MakeTypelist<
      T2, T3, T4, T5, T6, T7, T8, T9, T10,
      T11, T12, T13, T14, T15, T16, T17, T18>::Result TailResult;
public:
  typedef Typelist<T1, TailResult> Result;
};

template<>
struct MakeTypelist<> {
  typedef NullType Result;
};

template <class TList> struct Length;
template <> struct Length<NullType>
{
  enum { value = 0 };
};

template <class T, class U>
struct Length< Typelist<T, U> > {
  enum { value = 1 + Length<U>::value };
};
}

#define WTF_DECLARE_EVENT(name, signature, event_flags, arg_count, ...) \
  extern wtf::TypedEvent##arg_count<__VA_ARGS__> name

#define WTF_DEFINE_INSTANCE_EVENT(name, signature, event_flags, arg_count, ...) \
  wtf::TypedEvent##arg_count<__VA_ARGS__> name(signature, wtf::EventClass::Instance, event_flags)
#define WTF_DEFINE_SCOPE_EVENT(name, signature, event_flags, arg_count, ...) \
  wtf::TypedEvent##arg_count<__VA_ARGS__> name(signature, wtf::EventClass::Scope, event_flags)


}

#include "declare-events-pre.h"
#include "test-events.h"
#include "declare-events-post.h"

#include "define-events-pre.h"
#include "test-events.h"
#include "define-events-post.h"

#if defined(WIN32)
int _tmain(int argc, _TCHAR* argv[]) {
#else
int main(int argc, char** argv) {
#endif
  wtf::StreamTarget* target = new wtf::FileStreamTarget("test.wtf-trace");
  wtf::Session::Start(target);

  my::events::MyInstanceEventUI(10124);
  const char* foo = "foo";
  my::events::MyInstanceEventAscii(const_cast<char*>(foo));
  my::events::MyInstanceEventUtf8(L"bar");

  int8_t bytes[] = {1, 2, 3};
  wtf::Int8Array byte_array(bytes, sizeof(bytes));
  my::events::MyInstanceEventBytes(5, &byte_array);

  my::events::MyScopeEvent(123.45f, 15412);
  wtf::LeaveScope();

  wtf::Session::Stop();
  delete target;

  return 0;
}
