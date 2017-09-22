#!/bin/bash

find -name 'BUILD' -print0 | xargs -0 buildifier
