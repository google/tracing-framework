/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview WebGL-on-OpenGL generated output.
 * This file was generated using the Web Tracing Framework generate-webgl-app
 * tool.
 *
 * sudo apt-get install libgles2-mesa-dev
 * hg clone http://hg.libsdl.org/SDL
 * cd SDL/
 * ./configure && make
 * sudo make install
 *
 * @author benvanik@google.com (Ben Vanik)
 */

#include "webgl-shared.h"

#if !defined(CHECK_GL_ERROR)
#define CHECK_GL_ERROR 0
#endif
#if !defined(REPEAT_LAST_FRAME)
#define REPEAT_LAST_FRAME 0
#endif


#if defined(WIN32)
#pragma comment(lib, "SDL2.lib")
#if USE_ANGLE
#pragma comment(lib, "libGLESv2.lib")
#pragma comment(lib, "libEGL.lib")
#else
#pragma comment(lib, "OpenGL32.lib")
#pragma comment(lib, "glew32.lib")
#endif  // USE_ANGLE
#endif  // WIN32


static volatile int __debug_int = 0;
static volatile int __debug_int_out = 0;
#define FORCE_DEBUGGER() { __debug_int_out = 5 / __debug_int; }


void _checkSDLError(const char* file, int line) {
  const char* error = SDL_GetError();
  if (*error != '\0') {
    printf("SDL ERROR: %s:%d %s\n", file, line, error);
    SDL_ClearError();
  }
}

GLuint _checkGLError(const char* file, int line) {
#if CHECK_GL_ERROR
  GLuint error = glGetError();
  if (error)  {
    printf("GL ERROR: %s:%d %d\n", file, line, error);
  }
  return error;
#else
  return 0;
#endif  // CHECK_GL_ERROR
}


bool extensions_initialized = false;
PFNGLDRAWARRAYSINSTANCEDWGLPROC glDrawArraysInstancedWGL = 0;
PFNGLDRAWELEMENTSINSTANCEDWGLPROC glDrawElementsInstancedWGL = 0;
PFNGLVERTEXATTRIBDIVISORWGLPROC glVertexAttribDivisorWGL = 0;

void InitializeExtensions() {
  if (extensions_initialized) {
    return;
  }
  extensions_initialized = true;

#if defined(WIN32) && !USE_ANGLE
  glewInit();
#endif  // WIN32 && !USE_ANGLE

  printf("GL_VERSION: %s\n", glGetString(GL_VERSION));
  printf("GL_EXTENSIONS: %s\n", glGetString(GL_EXTENSIONS));

#if USE_ANGLE
  if (!strstr((const char*)glGetString(GL_EXTENSIONS),
              "GL_ANGLE_instanced_arrays")) {
    printf("Instanced arrays extension not available!\n");
    exit(1);
  }
  glDrawArraysInstancedWGL =
      (PFNGLDRAWARRAYSINSTANCEDWGLPROC)eglGetProcAddress(
          "glDrawArraysInstancedANGLE");
  glDrawElementsInstancedWGL =
      (PFNGLDRAWELEMENTSINSTANCEDWGLPROC)eglGetProcAddress(
          "glDrawElementsInstancedANGLE");
  glVertexAttribDivisorWGL =
      (PFNGLVERTEXATTRIBDIVISORWGLPROC)eglGetProcAddress(
          "glVertexAttribDivisorANGLE");
#else
  if (!SDL_GL_ExtensionSupported("GL_ARB_instanced_arrays")) {
    printf("Instanced arrays extension not available!\n");
    exit(1);
  }
  glDrawArraysInstancedWGL =
      (PFNGLDRAWARRAYSINSTANCEDWGLPROC)SDL_GL_GetProcAddress(
          "glDrawArraysInstancedARB");
  glDrawElementsInstancedWGL =
      (PFNGLDRAWELEMENTSINSTANCEDWGLPROC)SDL_GL_GetProcAddress(
          "glDrawElementsInstancedARB");
  glVertexAttribDivisorWGL =
      (PFNGLVERTEXATTRIBDIVISORWGLPROC)SDL_GL_GetProcAddress(
          "glVertexAttribDivisorARB");
#endif  // USE_ANGLE
}

#include <SDL_syswm.h>
CanvasContext::CanvasContext(
    const char* window_title, int handle) :
    window_title_(window_title), handle_(handle),
  window_(0) {

#if USE_ANGLE
#else
  //SDL_GL_SetAttribute(SDL_GL_CONTEXT_EGL, 1);
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
  SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 0);
  // SDL_GL_CONTEXT_PROFILE_MASK = mask SDL_GL_CONTEXT_PROFILE_ES
  SDL_GL_SetAttribute(SDL_GL_DOUBLEBUFFER, 1);
  SDL_GL_SetAttribute(SDL_GL_DEPTH_SIZE, 24);
  // SDL_GL_STENCIL_SIZE
  // SDL_GL_MULTISAMPLEBUFFERS
  // SDL_GL_MULTISAMPLESAMPLES
#endif  // USE_ANGLE

  char title[2048];
  sprintf(title, "%s : %d", window_title_, handle_);
  window_ = SDL_CreateWindow(
      title,
      SDL_WINDOWPOS_CENTERED,
      SDL_WINDOWPOS_CENTERED,
      800, 480,
      SDL_WINDOW_SHOWN | SDL_WINDOW_OPENGL);
  SDL_GetWindowSize(window_, &width_, &height_);
  CHECK_SDL();

#if USE_ANGLE
  SDL_SysWMinfo info;
  SDL_VERSION(&info.version);
  SDL_GetWindowWMInfo(window_, &info);
  HWND hWnd = info.info.win.window;
  es_.width = width_;
  es_.height = height_;
  es_.hWnd = hWnd;
  EGLint configAttribList[] = {
    EGL_RED_SIZE,       8,
    EGL_GREEN_SIZE,     8,
    EGL_BLUE_SIZE,      8,
    EGL_ALPHA_SIZE,     8 /*: EGL_DONT_CARE*/,
    EGL_DEPTH_SIZE,     EGL_DONT_CARE,
    EGL_STENCIL_SIZE,   EGL_DONT_CARE,
    EGL_SAMPLE_BUFFERS, 0,
    EGL_NONE,
  };
  EGLint surfaceAttribList[] = {
    //EGL_POST_SUB_BUFFER_SUPPORTED_NV, flags & (ES_WINDOW_POST_SUB_BUFFER_SUPPORTED) ? EGL_TRUE : EGL_FALSE,
    //EGL_POST_SUB_BUFFER_SUPPORTED_NV, EGL_FALSE,
    EGL_NONE, EGL_NONE,
  };
  EGLint contextAttribs[] = {
    EGL_CONTEXT_CLIENT_VERSION, 2,
    EGL_NONE, EGL_NONE,
  };
  es_.display = eglGetDisplay(GetDC(hWnd));
  if (!es_.display) {
    printf("eglGetDisplay failed\n");
    exit(1);
  }
  EGLint major_version, minor_version;
  if (!eglInitialize(es_.display, &major_version, &minor_version)) {
    printf("eglInitialize failed\n");
    exit(1);
  }
  EGLint num_configs;
  if (!eglGetConfigs(es_.display, NULL, 0, &num_configs)) {
    printf("eglGetConfigs failed\n");
    exit(1);
  }
  EGLConfig config;
  if (!eglChooseConfig(es_.display, configAttribList, &config, 1, &num_configs)) {
    printf("eglChooseConfigsfailed\n");
    exit(1);
  }
  es_.surface = eglCreateWindowSurface(
      es_.display, config, hWnd, surfaceAttribList);
  if (!es_.surface) {
    printf("eglCreateWindowSurface failed\n");
    exit(1);
  }
  es_.context = eglCreateContext(
      es_.display, config, EGL_NO_CONTEXT, contextAttribs);
  if (!es_.context) {
    printf("eglCreateContext failed\n");
    exit(1);
  }
  eglMakeCurrent(es_.display, es_.surface, es_.surface, es_.context);
  eglSwapInterval(es_.display, 0);
#else
  // Create GL.
  gl_ = SDL_GL_CreateContext(window_);
  SDL_GL_MakeCurrent(window_, gl_);
  CHECK_SDL();

  SDL_GL_SetSwapInterval(0);
  CHECK_SDL();
#endif  // USE_ANGLE

  InitializeExtensions();

  // Prepare viewport.
  glViewport(0, 0, width_, height_);
  CHECK_GL();
}

CanvasContext::~CanvasContext() {
  // nvogl crashes when deleting the context - not sure why...
#if 0
#if USE_ANGLE
  eglDestroyContext(es_.display, es_.context);
  eglDestroySurface(es_.display, es_.surface);
  eglTerminate(es_.display);
#else
  SDL_GL_MakeCurrent(NULL, NULL);
  SDL_GL_DeleteContext(gl_);
#endif  // USE_ANGLE
#endif

  SDL_DestroyWindow(window_);
}

void CanvasContext::MakeCurrent(int width, int height) {
#if USE_ANGLE
  eglMakeCurrent(es_.display, es_.surface, es_.surface, es_.context);
#else
  SDL_GL_MakeCurrent(window_, gl_);
  CHECK_SDL();
#endif  // USE_ANGLE

  if (width != -1 && height != -1) {
    if (width != width_ || height != height_) {
      // Resized.
      width_ = width;
      height_ = height;
      SDL_SetWindowSize(window_, width_, height_);
      CHECK_SDL();
      glViewport(0, 0, width_, height_);
      CHECK_GL();
    }
  }
}

void CanvasContext::Swap() {
#if USE_ANGLE
  eglMakeCurrent(es_.display, es_.surface, es_.surface, es_.context);
#else
  SDL_GL_MakeCurrent(window_, gl_);
  CHECK_SDL();
#endif  // USE_ANGLE

#if USE_ANGLE
  eglSwapBuffers(es_.display, es_.surface);
#else
  SDL_GL_SwapWindow(window_);
#endif  // USE_ANGLE
}

GLuint CanvasContext::GetObject(int handle) {
  return handle ? object_map_[handle] : 0;
}

void CanvasContext::SetObject(int handle, GLuint id) {
  object_map_[handle] = id;
}


Replay::Replay(const char* trace_name, const char* bin_name,
               const StepFunction* steps, int step_count) :
    trace_name_(trace_name), bin_name_(bin_name),
    bin_data_(0), bin_data_length_(0),
    steps_(steps), step_count_(step_count), step_index_(0) {
  SDL_Init(SDL_INIT_VIDEO);

  SDL_DisplayMode mode;
  SDL_GetDesktopDisplayMode(0, &mode);
  CHECK_SDL();
}

Replay::~Replay() {
  for (vector<CanvasContext*>::iterator it = contexts_.begin();
       it != contexts_.end(); ++it) {
    delete *it;
  }

  free(bin_data_);

  SDL_Quit();
}

bool Replay::LoadResources() {
  // Get executable path (without executable name).
  char file_path[2048];
  int file_path_size = sizeof(file_path);
#if defined(WIN32)
  const char path_sep = '\\';
  GetModuleFileNameA(NULL, file_path, file_path_size);
#elif defined(__APPLE__)
  const char path_sep = '/';
  _NSGetExecutablePath(file_path, file_path_size);
#else
  const char path_sep = '/';
  int file_path_length =
      readlink("/proc/self/exe", file_path, file_path_size - 1);
  if (file_path_length == -1) {
    printf("Can't find myself!\n");
    return 1;
  }
  file_path[file_path_length] = 0;
#endif
  char* last_slash = strrchr(file_path, path_sep);
  last_slash++;
  *last_slash = 0;

  // Required to find D3D compiler on Windows.
#if USE_ANGLE
  SetDllDirectoryA(file_path);
#endif  // USE_ANGLE

  // Open the .bin file.
  strcat(file_path, bin_name_);
  FILE* file = fopen(file_path, "r");
  if (!file) {
    printf("Unable to open bin file %s\n", bin_name_);
    return false;
  }

  fseek(file, 0, SEEK_END);
  bin_data_length_ = ftell(file);
  fseek(file, 0, SEEK_SET);

  bin_data_ = (uint8_t*)malloc(bin_data_length_);
  if (!bin_data_) {
    printf("Unable to allocate bin memory\n");
    return false;
  }

  fread(bin_data_, 1, bin_data_length_, file);

  fclose(file);

  return true;
}

const void* Replay::GetBinData(size_t offset, size_t length) {
  if (offset + length > bin_data_length_) {
    return NULL;
  }
  return bin_data_ + offset;
}

int Replay::Run() {
  bool running = true;
  while (running) {
    // Handle all pending SDL events.
    SDL_Event event;
    while (SDL_PollEvent(&event)) {
      switch (event.type) {
        case SDL_WINDOWEVENT_CLOSE:
        case SDL_QUIT:
          running = false;
          break;
        case SDL_WINDOWEVENT:
          printf("SDL_WINDOWEVENT(%d, %d, %d)\n",
                 event.window.event, event.window.data1, event.window.data2);
          switch (event.window.event) {
            case 14:
              running = false;
              break;
          }
          break;
        default:
          printf("SDL event: %d\n", event.type);
          break;
      }
    }
    if (!running) {
      break;
    }

    // Run next steps.
    // If we have no more steps, we exit after this loop.
    running = IssueNextStep();

    // Swap all windows.
    for (vector<CanvasContext*>::iterator it = contexts_.begin();
         it != contexts_.end(); ++it) {
      (*it)->Swap();
    }

    // TODO(benvanik): proper delay (or none?).
    //SDL_Delay(16);
  }
  return 0;
}

bool Replay::IssueNextStep() {
  // Issue the next step.
  //printf("STEP %d:\n", step_index_);
  StepFunction step = steps_[step_index_];
  step(this);

  // Return true = steps remaining.
#if REPEAT_LAST_FRAME
  if (step_index_ + 1 < step_count_) {
    step_index_++;
  }
  return true;
#else
  step_index_++;
  return step_index_ < step_count_;
#endif  // REPEAT_LAST_FRAME
}

CanvasContext* Replay::CreateContext(int handle) {
  CanvasContext* context = new CanvasContext(trace_name_, handle);
  contexts_.push_back(context);
  context_map_[handle] = context;
  return context;
}

CanvasContext* Replay::MakeContextCurrent(int handle, int width, int height) {
  CanvasContext* context = context_map_[handle];
  context->MakeCurrent(width, height);
  return context;
}


extern const char* __trace_name;
extern const char* __bin_name;
extern int __step_count;
extern StepFunction* __get_steps();

#if defined(WIN32)
int wmain(int argc, wchar_t *argv[]) {
#else
int main(int argc, char** argv) {
#endif  // WIN32

#if USE_ANGLE
  HMODULE m = LoadLibrary(L"d3dcompiler_46.dll");
  DWORD last_error = GetLastError();
  if (!m) {
    printf("error: %d\n", last_error);
    MessageBox(NULL, L"COULD NOT LOAD d3dcompiler_46.dll", L"Ack", MB_OK);
    return 1;
  }
#endif  // USE_ANGLE

  Replay replay(__trace_name, __bin_name, __get_steps(), __step_count);

  if (!replay.LoadResources()) {
    return 1;
  }

  return replay.Run();
}
