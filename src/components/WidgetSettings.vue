<template>
  <div class="f-row-ac">
    <v-select
      class="f-grow m-0"
      :items="widgets"
      :value="widget"
      @input="selectWidget"
    >
      <template v-slot:selection="{ text }">
        <div class="f-col">
          <span :class="{default: !widget}" class="f-grow" v-text="text || defaultWidget"/>
          <span v-if="widgetDetail" class="detail" v-text="widgetDetail"/>
        </div>
      </template>
      <template v-slot:item="{ item: option }">
        <span class="f-grow m-2" v-text="option.value ? option.text : attr.widget || 'Not configured'"/>
        <v-icon v-if="option.icon" :name="option.icon" class="m-2"/>
      </template>
    </v-select>
    <v-btn
      v-if="isConfigurable"
      :disabled="!isConfigurable"
      class="icon m-0 p-1"
      @click="$refs.dialog.show()"
    >
      <v-icon name="settings"/>
    </v-btn>
    <v-dialog ref="dialog" :title="`Widget Settings (${attr.name})`">
      <div class="widget-config f-col light">
        <template v-if="widget === 'Autofill'">
          <v-select
            class="filled"
            label="Value"
            :items="autofillOptions"
            :value="config.value"
            @input="updateConfig('value', $event)"
          />
          <span class="field-label mx-2 mt-2">Operations</span>
          <!-- <v-checkbox label="Insert" :value="config.insert" @input="updateConfig('insert', $event)"/> -->
          <div class="f-row-ac">
            <v-checkbox
              label="Insert"
              :value="config.operations || []"
              val="insert"
              @input="updateConfig('operations', $event)"
            />
            <v-checkbox
              label="Update"
              :value="config.operations || []"
              val="update"
              @input="updateConfig('operations', $event)"
            />
          </div>
        </template>
        <template v-if="widget === 'ValueMap'">
          <v-table :columns="valueMapColumns" :items="valueMapItems"/>
        </template>
        <media-widget-settings
          v-if="widget === 'MediaFile'"
          :config="config"
          @update="updateConfig"
        />
      </div>
    </v-dialog>
  </div>
</template>

<script>

import { valueMapItems } from '@/adapters/attributes'
import MediaWidgetSettings, { MediaTypesList } from './MediaWidgetSettings.vue'

export default {
  components: { MediaWidgetSettings },
  props: {
    attr: Object,
    attrSettings: Object
  },
  computed: {
    widget () {
      if (this.attr.widget === 'ValueMap') {
        return this.attr.widget
      }
      return this.attrSettings?.widget
    },
    allWidgets () {
      return [
        { text: 'TextField', value: 'TextField' },
        { text: 'Autofill', value: 'Autofill', configurable: true },
        { text: 'Checkbox', value: 'Checkbox' },
        { text: 'DateField', value: 'DateField' },
        { text: 'Hyperlink', value: 'Hyperlink' },
        { text: 'Image', value: 'Image' },
        { text: 'Media File', value: 'MediaFile', configurable: true },
        { text: 'ValueMap', value: 'ValueMap', icon: 'qgis', configurable: true },
        { text: 'Hidden', value: 'Hidden' }
      ]
    },
    widgets () {
      const { type } = this.attr
      // const pick = values => this.allWidgets.filter(i => values.includes(i.value))

      const pick = values => values.concat('Hidden').map(v => this.allWidgets.find(i => i.value === v))

      if (this.widget === 'ValueMap') {
        return pick(['ValueMap'])
      }
      if (type === 'bool') {
        return pick(['Checkbox'])
      } else if (type === 'int' || type === 'uint') {
        return pick(['TextField', 'Hyperlink', 'Image', 'Autofill'])
      } else if (type === 'date') {
        return pick(['DateField', 'Autofill', 'TextField'])
      } else if (type === 'datetime') {
        return pick(['TextField', 'Autofill'])
      } else if (type === 'text') {
        return pick(['TextField', 'Hyperlink', 'Image', 'MediaFile', 'Autofill'])
      }
      return pick(['TextField'])
    },
    isConfigurable () {
      return this.widgets.find(w => w.value === this.widget)?.configurable
    },
    config () {
      return this.attrSettings?.config ?? {}
    },
    defaultWidget () {
      return this.widgets[0]?.value || 'TextField'
    },
    widgetDetail () {
      if (this.widget === 'MediaFile') {
        const types = MediaTypesList.reduce((data, item) => (data[item.value] = item.text, data), {})
        let typeInfo = ''
        if (Array.isArray(this.config?.accept)) {
          typeInfo = this.config.accept.map(v => types[v]).join(', ')
        } else {
          typeInfo = this.config.accept
        }
        if (typeInfo) {
          return `(${typeInfo})`
        }
      }
      return ''
    },
    valueMapItems () {
      return this.widget === 'ValueMap' && valueMapItems(this.attr)
    },
    valueMapColumns () {
      return [
        {
          label: 'Value',
          key: 'value'
        }, {
          label: 'Label',
          key: 'text'
        }
      ]
    },
    autofillOptions () {
      const opts = [{
        text: 'Autogenerated',
        value: ''
      }]
      if (this.attr.type === 'text') {
        opts.push({
            text: 'User',
            value: 'user'
        })
      } else if (this.attr.type === 'date') {
        opts.push({
          text: 'Current Date',
          value: 'current_date'
        })
      } else if (this.attr.type === 'datetime') {
        opts.push({
          text: 'Current Time',
          value: 'current_datetime'
        })
      }
      return opts
    }
  },
  methods: {
    selectWidget (widget) {
      this.$emit('input', { widget })
      if (this.attrSettings?.config) {
        this.$delete(this.attrSettings, 'config')
      }
    },
    updateConfig (key, value) {
      if (!this.attrSettings.config) {
        this.$set(this.attrSettings, 'config', { [key]: value })
      } else {
        this.$set(this.attrSettings.config, key, value)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.default {
  opacity: 0.6;
}
.widget-config {
  min-width: 440px;
  padding: 8px 4px;
}
:deep(.field-label) {
  font-weight: 500;
  text-transform: uppercase;
  font-size: 11.5px;
  opacity: 0.75;
}
.detail {
  margin-top: 1px;
  font-size: 11px;
  opacity: 0.7;
}
</style>
