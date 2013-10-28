/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview Shared WebGL header file.
 *
 * @author benvanik@google.com (Ben Vanik)
 */

#if !defined(USE_ANGLE) && defined(WIN32)
#define USE_ANGLE 1
#endif

#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <unordered_map>
#include <vector>

#if defined(WIN32)
#include <windows.h>
#else
#include <unistd.h>         // readlink
#endif  // WIN32

#include <SDL.h>

#if defined(WIN32)
#if USE_ANGLE
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#else
#include <GL/glew.h>
#include <GL/wglew.h>
#endif  // USE_ANGLE
#else
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#endif  // WIN32

#if USE_ANGLE
#include <EGL/egl.h>
typedef struct {
   GLint       width;
   GLint       height;
   EGLNativeWindowType  hWnd;
   EGLDisplay  display;
   EGLContext  context;
   EGLSurface  surface;
} ESContext;
#endif  // USE_ANGLE


using namespace std;


void _checkSDLError(const char* file, int line);
GLuint _checkGLError(const char* file, int line);
#define  CHECK_SDL(...)   _checkSDLError(__FILE__, __LINE__)
#define  CHECK_GL(...)    _checkGLError(__FILE__, __LINE__)


typedef void (*PFNGLDRAWARRAYSINSTANCEDWGLPROC)(
    GLenum, GLint, GLsizei, GLsizei);
typedef void (*PFNGLDRAWELEMENTSINSTANCEDWGLPROC)(
    GLenum, GLsizei, GLenum, const GLvoid*, GLsizei);
typedef void (*PFNGLVERTEXATTRIBDIVISORWGLPROC)(
    GLuint index, GLuint divisor);

extern PFNGLDRAWARRAYSINSTANCEDWGLPROC glDrawArraysInstancedWGL;
extern PFNGLDRAWELEMENTSINSTANCEDWGLPROC glDrawElementsInstancedWGL;
extern PFNGLVERTEXATTRIBDIVISORWGLPROC glVertexAttribDivisorWGL;


class Replay;
typedef void (*StepFunction)(Replay*);


class CanvasContext {
public:
  CanvasContext(const char* window_title, int handle);
  ~CanvasContext();

  void MakeCurrent(int width = -1, int height = -1);

  void Swap();

  GLuint GetObject(int handle);
  void SetObject(int handle, GLuint id);

private:
  const char*     window_title_;
  int             handle_;
  SDL_Window*     window_;

#if USE_ANGLE
  ESContext       es_;
#else
  SDL_GLContext   gl_;
#endif  // USE_ANGLE

  int             width_;
  int             height_;

  unordered_map<int, GLuint> object_map_;
};


class Replay {
public:
  Replay(const char* trace_name, const char* bin_name,
         const StepFunction* steps, int step_count);
  ~Replay();

  bool LoadResources();
  const void* GetBinData(size_t offset, size_t length);

  int Run();
  bool IssueNextStep();

  CanvasContext* CreateContext(int handle);
  CanvasContext* MakeContextCurrent(
      int handle, int width = -1, int height = -1);

private:
  const char* trace_name_;
  const char* bin_name_;
  const StepFunction* steps_;
  int   step_count_;
  int   step_index_;

  uint8_t*  bin_data_;
  size_t    bin_data_length_;

  vector<CanvasContext*> contexts_;
  unordered_map<int, CanvasContext*> context_map_;
};
