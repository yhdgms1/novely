export const snow = {
  'particles': {
    'number': {
      'value': 202,
      'density': {
        'enable': true,
        'value_area': 800
      }
    },
    'color': {
      'value': '#e9db8e'
    },
    'opacity': {
      'value': 0.9299789953020032,
      'random': true,
      'anim': {
        'enable': true,
        'speed': 1,
        'opacity_min': 0,
        'sync': false
      }
    },
    'size': {
      'value': 3,
      'random': true,
      'anim': {
        'enable': false,
        'speed': 4,
        'size_min': 0.3,
        'sync': false
      }
    },
    'move': {
      'enable': true,
      'speed': 3.017060304327615,
      'direction': 'none',
      'random': true,
      'straight': false,
      'out_mode': 'out',
      'bounce': false,
      'attract': {
        'enable': false,
        'rotateX': 1042.21783956259,
        'rotateY': 600
      }
    }
  },
  'interactivity': {
    'detect_on': 'canvas',
    'events': {
      'onhover': {
        'enable': true,
        'mode': 'bubble'
      },
      'onclick': {
        'enable': true,
        'mode': 'repulse'
      },
      'resize': true
    },
    'modes': {
      'bubble': {
        'distance': 250,
        'size': 0,
        'duration': 2,
        'opacity': 0,
        'speed': 3
      },
      'repulse': {
        'distance': 400,
        'duration': 0.4
      },
    }
  },
  'retina_detect': true
} as const;

export const fireflies = {
  'particles': {
    'number': {
      'value': 400,
      'density': {
        'enable': true,
        'value_area': 3000
      }
    },
    'color': {
      'value': '#fc0000'
    },
    'shape': {
      'type': 'circle',
      'stroke': {
        'width': 0,
        'color': '#000000'
      },
      'polygon': {
        'nb_sides': 3
      },
      'image': {
        'src': 'img/github.svg',
        'width': 100,
        'height': 100
      }
    },
    'opacity': {
      'value': 0.5,
      'random': true,
      'anim': {
        'enable': false,
        'speed': 1,
        'opacity_min': 0.1,
        'sync': false
      }
    },
    'size': {
      'value': 2,
      'random': true,
      'anim': {
        'enable': true,
        'speed': 5,
        'size_min': 0,
        'sync': false
      }
    },
    'line_linked': {
      'enable': false,
      'distance': 500,
      'color': '#ffffff',
      'opacity': 0.4,
      'width': 2
    },
    'move': {
      'enable': true,
      'speed': 7.8914764163227265,
      'direction': 'top',
      'random': true,
      'straight': false,
      'out_mode': 'out',
      'bounce': false,
      'attract': {
        'enable': false,
        'rotateX': 600,
        'rotateY': 1200
      }
    }
  },
  'interactivity': {
    'detect_on': 'canvas',
    'events': {
      'onhover': {
        'enable': false,
        'mode': 'bubble'
      },
      'onclick': {
        'enable': false,
        'mode': 'repulse'
      },
      'resize': true
    },
    'modes': {
      'grab': {
        'distance': 400,
        'line_linked': {
          'opacity': 0.5
        }
      },
      'bubble': {
        'distance': 400,
        'size': 4,
        'duration': 0.3,
        'opacity': 1,
        'speed': 3
      },
      'repulse': {
        'distance': 200,
        'duration': 0.4
      },
      'push': {
        'particles_nb': 4
      },
      'remove': {
        'particles_nb': 2
      }
    }
  },
  'retina_detect': true
} as const;