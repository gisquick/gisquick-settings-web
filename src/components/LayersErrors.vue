<template>
  <div v-if="errors" class="errors f-col">
    <v-dialog ref="layerNamesDialog" title="QGIS Server layers names">
      <template v-slot="{ data, close }">
        <short-names-editor :meta="data" @project-update="close"/>
      </template>
    </v-dialog>
    <div class="header errors f-row-ac dark px-4">
      <v-icon name="warning" class="mr-2"/>
      <span class="title">Errors</span>
    </div>

    <template v-if="errors.duplicateLayersNames">
      <span class="p-2"><strong>Layers does not have unique names.</strong> Duplicit names (or short names):</span>
      <ul>
        <li v-for="(layers, n) in errors.duplicateLayersNames" :key="n">
          <strong v-text="n"/> <span>({{ layers.join('; ') }})</span>
        </li>
      </ul>
    </template>

    <template v-if="errors.invalidLayersNames">
      <strong class="p-2">Invalid QGIS Server layers names:</strong>
      <ul>
        <li v-for="n in errors.invalidLayersNames" :key="n" v-text="n"/>
      </ul>
    </template>

    <template v-if="errors.invalidWmsNameGroups">
      <strong class="p-2">Invalid QGIS Server group names:</strong>
      <ul>
        <li v-for="(g, i) in errors.invalidWmsNameGroups" :key="i" v-text="g.name"/>
      </ul>
    </template>

    <template v-if="errors.invalidLayersNames || errors.duplicateLayersNames || errors.invalidWmsNameGroups">
      <div class="hint p-2">
        <span>It is recommended to assign a unique <strong>Short name</strong> for every layer and group,
          which should start with an unaccented alphabetical letter, followed by any alphanumeric letters, dot, dash or underscore.</span>
          You can configure them in QGIS
          <span class="breadcrumb">(
            <strong>Layer Properties</strong>
            <v-icon name="arrow-right" size="12"/>
            <strong>QGIS Server</strong>
            <!-- <v-icon name="arrow-right" size="12"/>
            <strong>Short name</strong> -->
          )</span>
          <span>, or directly from the web interface:</span>
      </div>
      <v-btn class="outlined round" @click="$refs.layerNamesDialog.show(projectInfo)">Manage layers names</v-btn>
    </template>

    <template v-if="errors.filesOutsideDirectory">
      <strong class="p-2">Data files outside of project's directory:</strong>
      <ul>
        <li v-for="n in errors.filesOutsideDirectory" :key="n" v-text="n"/>
      </ul>
    </template>
  </div>
</template>

<script>
import isEmpty from 'lodash/isEmpty'
import countBy from 'lodash/countBy'
import pickBy from 'lodash/pickBy'
import mapValues from 'lodash/mapValues'

import ShortNamesEditor from '@/components/ShortNamesEditor.vue'
import { layersGroups, isValidLayerName } from '@/utils/layers'

const absPathRegex = /^(\w:)?\//

function filesOutsideDirectory (projectInfo) {
  const layers = Object.values(projectInfo.layers)
  const dataFiles = layers.reduce((files, l) => {
    const file = l.source_params?.file
    if (file && (file.startsWith('..') || absPathRegex.test(file))) {
      files.add(file)
    }
    return files
  }, new Set())
  return Array.from(dataFiles)
}

export function layersErrors (projectInfo) {
  const errors = {}
  const groups = layersGroups(projectInfo.layers_tree)
  const invalidGroups = groups.filter(g => !g.wms_name || !isValidLayerName(g.wms_name))
  if (invalidGroups.length) {
    errors.invalidWmsNameGroups = invalidGroups
  }
  const layers = Object.values(projectInfo.layers)
  const names = layers.map(l => l.name)
  const duplicates = pickBy(countBy(names), count => count > 1)
  if (!isEmpty(duplicates)) {
    // errors.duplicateLayersNames = Object.keys(duplicates)
    errors.duplicateLayersNames = mapValues(duplicates, (_, name) => layers.filter(l => l.name === name).map(l => l.title))
  }

  const invalidNames = names.filter(n => !isValidLayerName(n))
  if (invalidNames.length) {
    errors.invalidLayersNames = invalidNames
  }
  const fod = filesOutsideDirectory(projectInfo)
  if (fod?.length) {
    errors.filesOutsideDirectory = fod
  }
  return isEmpty(errors) ? null : errors
}

export default {
  components: {
    ShortNamesEditor,
  },
  props: {
    errors: Object,
    projectInfo: Object
  }
}
</script>

<style lang="scss" scoped>
.short-names-editor {
  // overflow: auto;
  overflow: hidden;
  :deep(.layers-table) {
    overflow: auto;
    min-height: 0;
    flex-shrink: 1;
  }
}
.header {
  background-color: var(--color-red);
  height: 32px;
  font-weight: 500;
  font-size: 17px;
}
.hint {
  font-size: 14px;
  color: #707070;
}
.btn {
  align-self: center;
  width: 400px;
}
.breadcrumb {
  display: inline-flex;
  align-items: center;
  > * {
    margin: 0 3px;
  }
}
</style>
