<template>
  <div class="process-block">
    <div class="process-header f-row-ac px-2" :class="{ expanded }" @click="expanded = !expanded">
      <v-icon
        :name="expanded ? 'arrow-down' : 'arrow-right'"
        size="14"
        class="mr-2 toggle-icon"
      />
      <span class="process-id">{{ value._key }}</span>
      <div class="f-grow"/>
      <v-btn class="icon small" @click.stop="$emit('remove')">
        <v-icon name="delete_forever" size="16"/>
      </v-btn>
    </div>

    <v-collapsible>
      <div v-if="expanded" class="process-body">
        <template v-if="desc">
          <div v-if="desc.title && desc.title !== value._key" class="proc-title">
            {{ desc.title }}
          </div>
          <div v-if="desc.description" class="proc-description">
            {{ desc.description }}
          </div>
          <template v-if="inputs.length">
            <div class="subsection-title">Inputs</div>
            <div
              v-for="inp in inputs"
              :key="inp.name"
              class="proc-input"
            >
              <span class="inp-name">{{ inp.name }}</span>
              <span v-if="inp.description" class="inp-desc">{{ inp.description }}</span>
            </div>
          </template>
        </template>
        <div v-else class="proc-description no-desc">No description available.</div>
      </div>
    </v-collapsible>
  </div>
</template>

<script>
export default {
  name: 'ProcessingProcessBlock',
  props: {
    value: {
      type: Object,
      required: true
    },
    initiallyExpanded: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      expanded: this.initiallyExpanded
    }
  },
  computed: {
    desc () {
      return this.value.description || null
    },
    inputs () {
      const inp = this.desc && this.desc.inputs
      if (!inp) return []
      return Object.entries(inp).map(([name, def]) => ({
        name,
        description: def.description || def.title || ''
      }))
    }
  }
}
</script>

<style lang="scss" scoped>
.process-block {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.process-header {
  height: 42px;
  background-color: #eee;
  cursor: pointer;
  user-select: none;
  border-left: 3px solid transparent;
  transition: background-color 0.15s, border-color 0.15s;

  &:hover {
    background-color: #e4e4e4;
  }

  &.expanded {
    border-left-color: var(--color-primary);
    border-bottom: 1px solid #ddd;
  }
}

.toggle-icon {
  flex-shrink: 0;
}

.process-id {
  font-size: 13.5px;
  font-weight: 500;
}

.process-body {
  padding: 14px 16px;
  background-color: #fafafa;
}

.proc-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.proc-description {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 12px;
  max-width: 640px;

  &.no-desc {
    font-style: italic;
    color: #aaa;
    margin-bottom: 0;
  }
}

.subsection-title {
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(46, 108, 158, 0.85);
  margin-bottom: 8px;
}

.proc-input {
  padding: 5px 0 5px 10px;
  border-left: 2px solid #e0e0e0;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
}

.inp-name {
  display: inline-block;
  background: rgba(46, 108, 158, 0.09);
  color: rgb(46, 108, 158);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 12px;
  font-family: monospace;
  font-weight: 600;
}

.inp-desc {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}
</style>
