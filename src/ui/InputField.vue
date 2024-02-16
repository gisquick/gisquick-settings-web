<template>
  <div class="i-field" :style="styles">
    <label
      v-if="label"
      @click="onClick"
      v-text=label
    />
    <slot/>
    <span v-if="errorText" class="error" v-text="errorText"/>
  </div>
</template>

<script>
import { colorVars } from './utils/colors'

// Source: https://zellwk.com/blog/keyboard-focusable-elements/
/**
 * Gets keyboard-focusable elements within a specified element
 * @param {HTMLElement} [element=document] element
 * @returns {Array}
 */
function getFocusableElement (element = document) {
  const targets = [...element.querySelectorAll(
    'a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])'
  )]
  return targets.find(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
}

export default {
  props: {
    label: String,
    focus: Function,
    error: [String, Error, Boolean],
    color: String,
    validator: Function,
    value: {}
  },
  computed: {
    baseColorStyle () {
      return this.color ? colorVars(this.color) : {}
    },
    statusStyle () {
      return this.inputError ? colorVars('red', 'status-color') : {}
    },
    styles () {
      return { ...this.baseColorStyle, ...this.statusStyle }
    },
    validatorError () {
      return this.validator?.(this.value)
    },
    inputError () {
      return this.error || this.validatorError
    },
    errorText () {
      const error = this.inputError
      if (error instanceof Error) {
        return error.message
      } else if (typeof(error) === 'boolean') {
        return ''
      }
      return error
    }
  },
  methods: {
    onClick () {
      if (this.focus) {
        this.focus?.()
      } else {
        console.log('focusable choice', getFocusableElement(this.$el))
        getFocusableElement(this.$el)?.focus()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.input {
  height: 32px;
}
.i-field {
  display: grid;
  // grid-template-rows: auto 1fr auto; // gap doesn't work nice when optional elements are not rendered
  grid-auto-flow: row;
  margin: var(--gutter);
  position: relative;
  // transition: all .4s cubic-bezier(.25,.8,.25,1);

  .input {
    position: relative;
    transition: all .4s cubic-bezier(.25,.8,.25,1);
    &[disabled] {
      pointer-events: none;
    }
    &::after {
      content: "";
      position: absolute;
      // bottom: -2px;
      bottom: 0;
      right: 0;
      width: 0;
      height: 1px;
      background-color: var(--status-color, var(--color));
      transition: width .3s cubic-bezier(.25,.8,.25,1);
      z-index: 1;
    }
  }
  &.flat {
    .input {
      border: solid;
      border-width: 0 0 1px 0;
      border-color: var(--border-color);
      // border-color: var(--status-color, var(--border-color));

      &[disabled] {
        // background-color: #EAEAEA;
        border-style: dashed;
      }
    }
  }
  &.filled {
    gap: 2px;
    .input {
      padding: 2px 4px;
  
      // border: 1px solid var(--status-color, var(--border-color));
      border: 1px solid;
      // border-color: var(--status-color, var(--border-color));
      border-color: var(--border-color);

      border-radius: 3px;
      background-color: var(--fill-color);

      &[disabled] {
        // --fill-color: transparent;
        // border-style: dashed;
        opacity: 0.5;
      }
    }
  }
  // --border-color: #ddd;
  &.focused {
    > .input {
      // --border-color: var(--status-color, var(--color));
      border-color: var(--status-color, var(--color));
      // box-shadow: 2px 4px 10px rgba(var(--color-rgb), 0.12);
      &::after {
        width: 100%;
        box-shadow: 1px 4px 6px rgba(var(--color-rgb), 0.35);
      }
    }
  }
  &.inline {
    align-items: center;
    grid-auto-flow: column;
    // grid-template-rows: unset;
    grid-template-columns: auto 1fr;
    gap: 6px;

    label {
      font-size: 12px;
    }
  }

  &.semi-flat {
    gap: 2px;
    .input {
      padding: 0 6px;
      margin-top: 3px;
      border: solid var(--border-color);
      border-width: 0 0 1px 0;
      background-color: var(--fill-color);
      // border-top-left-radius: 3px;
      // border-top-right-radius: 3px;
      &[disabled] {
        border-style: dashed;
        opacity: 0.7;
      }
    }
  }

  label {
    justify-self: start;
    line-height: 1;
    text-transform: uppercase;
    font-size: 11.5px;
    opacity: 0.75;
    color: var(--status-color, currentColor);
    font-weight: 500;

    // color: var(--status-color, rgba(currentColor, 0.5));
  }
  &.focused {
    > label {
      opacity: 1;
      color: var(--status-color, var(--color));
    }
  }
  &.required {
    > label {
      font-weight: 700;
    }
  }
  .error {
    color: var(--color-red);
    font-size: 12.5px;
    // font-weight: 500;
    min-height: 20px;
    padding: 2px 0;
  }
}

  // box-shadow: 2px 4px 8px rgba(#000, 0.05);
  // box-shadow: 2px 4px 10px rgba(#000, 0.15);
  // border-top-left-radius: 4px;
  // border-top-right-radius: 4px;
</style>
