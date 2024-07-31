<template>
  <div class="relations-form f-col">
    <div class="grid">
      <v-text-field
        class="filled"
        label="Name"
        :disabled="isQgisRelation"
        v-model="name"
      />
      <v-select
        class="filled"
        label="Strength"
        :disabled="isQgisRelation"
        :items="strengthList"
        v-model="strength"
      />
      <v-text-field
        class="filled"
        label="Referenced layer"
        :value="layer.name"
        readonly
      />
      <!-- <v-select
        class="filled"
        label="Referencing layer"
        :items="layers"
        item-text="name"
        item-value="name"
        v-model="referencing_layer"
      /> -->
      <v-autocomplete
        class="filled"
        label="Referencing layer"
        :disabled="isQgisRelation"
        :items="layers"
        item-value="name"
        filter-fields="name,title"
        highlight-fields="name,title"
        v-model="referencing_layer"
      >
        <template v-slot:item="{ html }">
          <div class="ac-item f-row f-grow">
            <div class="f-grow">
              <div class="title" v-html="html.name"/>
              <div class="f-row">
                <small v-html="html.title" class="f-grow mr-2"/>
              </div>
            </div>
          </div>
        </template>
      </v-autocomplete>
      <template v-for="_, index in referenced_fields">
        <v-autocomplete
          :key="`s-${index}`"
          class="filled"
          label="Referenced field"
          :disabled="isQgisRelation"
          :items="layer.attributes"
          item-value="name"
          filter-fields="name,alias"
          highlight-fields="name,alias"
          v-model="referenced_fields[index]"
        >
          <template v-slot:item="{ html }">
            <div class="ac-item f-row f-grow">
              <div class="f-grow">
                <div class="title" v-html="html.name"/>
                <div class="f-row">
                  <small v-html="html.alias" class="f-grow mr-2"/>
                </div>
              </div>
            </div>
          </template>
        </v-autocomplete>
        <v-autocomplete
          :key="`t-${index}`"
          class="filled"
          label="Referencing field"
          :disabled="isQgisRelation || !referencing_layer"
          :items="referencingAttributes"
          item-value="name"
          filter-fields="name,alias"
          highlight-fields="name,alias"
          v-model="referencing_fields[index]"
        >
          <template v-slot:item="{ html }">
            <div class="ac-item f-row f-grow">
              <div class="f-grow">
                <div class="title" v-html="html.name"/>
                <div class="f-row">
                  <small v-html="html.alias" class="f-grow mr-2"/>
                </div>
              </div>
            </div>
          </template>
        </v-autocomplete>
      </template>
    </div>
    <!-- <v-btn v-if="!fields" :disabled="!referencing_layer" @click="fields = []">Select Info Panel fields</v-btn> -->
    <!-- <v-checkbox
      label="Select Info Panel fields"
      :value="!!fields"
      @input="fields = $event ? [] : null"
    /> -->
    <v-select
      class="filled"
      label="Infopanel"
      :items="infopanelDisplayOpts"
      v-model="infopanel_view"
      @input="fields = $event === 'selected' ? [] : null"
    />
    <v-table
      v-if="infopanel_view === 'selected'"
      class="outlined mx-2"
      :columns="relationAttributesColumns"
      :items="referencingAttributes"
    >
      <!-- eslint-disable-next-line -->
      <template v-slot:cell(visibility)="{ item }">
        <!-- <v-checkbox
          :value="fields || []"
          :val="item.name"
          @input="fields = $event"
        /> -->
        <v-checkbox
          :val="item.name"
          v-model="fields"
        />
      </template>
    </v-table>
    <div v-if="infopanel_view !== 'hidden'" class="grid">
      <v-select
        class="filled"
        label="Label fields"
        :items="referencingAttributes"
        item-text="name"
        item-value="name"
        v-model="label_fields"
        multiple
      />
      <v-text-field
        class="filled"
        label="Label separator"
        :disabled="!label_fields || label_fields.length < 1"
        v-model="label_separator"
      />
    </div>
    <div class="f-row-ac">
      <v-btn
        color="red"
        class="mr-auto"
        :disabled="isQgisRelation"
        @click="$emit('delete', relation)"
      >
        Delete
      </v-btn>
      <div class="f-grow"/>
      <v-btn class="outlined" @click="$emit('close')">Cancel</v-btn>
      <v-btn
        color="green"
        :disabled="!isValid"
        @click="submit"
      >
        Submit
      </v-btn>
    </div>
  </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import VAutocomplete from '@/ui/Autocomplete.vue'

export default {
  components: { VAutocomplete },
  props: {
    layer: Object,
    project: Object,
    relation: Object
  },
  data () {
    return {
      name: '',
      strength: '',
      referencing_layer: null,
      referencing_fields: [null],
      referenced_fields: [null],
      strength: 0,
      fields: null,
      infopanel_view: 'all',
      label_fields: null,
      label_separator: ''
    }
  },
  computed: {
    strengthList () {
      return [
        { text: 'Association', value: 0 },
        { text: 'Composition', value: 1 }
      ]
    },
    infopanelDisplayOpts () {
      return [
        { text: 'Hidden', value: 'hidden' },
        { text: 'Display all fields', value: 'all' },
        { text: 'Selected fields', value: 'selected' }
      ]
    },
    relationAttributesColumns () {
      return [
        {
          key: 'name',
          label: 'Name'
        }, {
          key: 'alias',
          label: 'Alias'
        }, {
          key: 'type',
          label: 'Type'
        }, {
          key: 'widget',
          label: 'Widget',
          header: { width: 1 }
        }, {
          key: 'visibility',
          label: 'Visibility',
          header: { width: 1 },
          align: 'center'
        }
      ]
    },
    isQgisRelation () {
      return !!this.relation?.id
    },
    layers () {
      return Object.values(this.project.meta.layers)//.filter(l => l.id !== this.layer.id)
    },
    layerSettings () {
      return this.project.settings.layers[this.layerId]
    },
    referencingAttributes () {
      const layer = this.layers.find(l => l.name === this.referencing_layer)
      return layer?.attributes
    },
    isValid () {
      return this.name && this.referencing_layer && this.referencing_fields[0]  && this.referenced_fields[0]
    }
  },
  created () {
    if (this.relation) {
      const { referencing_layer, ...params } = this.relation
      this.referencing_layer = referencing_layer.name
      Object.assign(this.$data, cloneDeep(params))
    }
  },
  watch: {
    referencing_layer () {
      if (this.referencingAttributes) {
        this.referencing_fields = this.referencing_fields.map(f => this.referencingAttributes.some(a => a.name === f) ? f : null)
      }
    }
  },
  methods: {
    submit () {
      this.$emit('submit', this.$data, this.relation)
    }
  }
}
</script>

<style lang="scss" scoped>
.relations-form {
  min-width: 600px;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
