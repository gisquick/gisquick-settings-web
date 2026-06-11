import VIcon from './ui/Icon.vue'
import VBtn from './ui/Button.vue'
import VBadge from './ui/Badge.vue'
import VCheckbox from './ui/Checkbox.vue'
import VCollapsible from './ui/Collapsible.vue'
import VDateField from './ui/DateField.vue'
import VDatetimeField from '@/ui/DatetimeField.vue'
import VDialog from './ui/Dialog.vue'
import VFileField from './ui/FileField.vue'
import VLinearProgress from './ui/LinearProgress.vue'
import VList from './ui/List3.vue'
import VMenu from './ui/Menu.vue'
import VRadioBtn from './ui/RadioButton.vue'
import VScrollArea from './ui/ScrollArea.vue'
import VSelect from './ui/Select2.vue'
import VSlider from './ui/Slider2.vue'
import VSpinner from './ui/Spinner.vue'
import VSwitch from './ui/Switch.vue'
import VTable from './ui/Table.vue'
import VTabs from './ui/Tabs.vue'
import VTextField from './ui/TextField.vue'
import VTooltip from './ui/Tooltip.vue'
import VTreeView from './ui/TreeView.vue'
import Translate from './ui/Translate.vue'

function ShallowObj (Vue, obj) {
  const refs = {}
  Vue.observable(refs)
  Object.keys(obj).forEach(key => {
    Vue.util.defineReactive(refs, key, obj[key], null, true)
  })
  return refs
}

export default {
  install (Vue) {
    Vue.component('v-btn', VBtn)
    Vue.component('v-badge', VBadge)
    Vue.component('v-collapsible', VCollapsible)
    Vue.component('v-icon', VIcon)
    Vue.component('v-checkbox', VCheckbox)
    Vue.component('v-date-field', VDateField)
    Vue.component('v-datetime-field', VDatetimeField)
    Vue.component('v-dialog', VDialog)
    Vue.component('v-file-field', VFileField)
    Vue.component('v-linear-progress', VLinearProgress)
    Vue.component('v-list', VList)
    Vue.component('v-menu', VMenu)
    Vue.component('v-radio-btn', VRadioBtn)
    Vue.component('v-scroll-area', VScrollArea)
    Vue.component('v-select', VSelect)
    Vue.component('v-slider', VSlider)
    Vue.component('v-spinner', VSpinner)
    Vue.component('v-switch', VSwitch)
    Vue.component('v-table', VTable)
    Vue.component('v-tabs', VTabs)
    Vue.component('v-text-field', VTextField)
    Vue.component('v-tooltip', VTooltip)
    Vue.component('v-tree-view', VTreeView)
    Vue.component('translate', Translate) // not real translate, just to prevent errors in infopanel

    const store = ShallowObj(Vue, { activeEl: null, popups: {} })
    const focusListener = () => {
      // console.log('focused: ', document.activeElement)
      store.activeEl = document.activeElement
    }
    document.addEventListener('focus', focusListener, true)
    const chains = {}
    store.addPopup = (id, srcEl, popupEl) => {
      // console.log('# addPopup')
      for (const [pid, [sEl, pEl]] of Object.entries(store.popups)) {
        if (pEl.contains(srcEl)) {
          // console.log('Nested Popups:', id, '->', pid)
          chains[id] = pid
        }
      }
      store.popups[id] = [srcEl, popupEl]
    }
    store.removePopup = id => {
      // console.log('# removePopup', id)
      delete store.popups[id]
      delete chains[id]
    }
    store.isLinked = (target, src) => {
      // console.log('chains', chains)
      for (const [pid, [_, pEl]] of Object.entries(store.popups)) {
        if (pEl.contains(target)) {
          // console.log('popup id', pid)
          let originId = pid
          while (chains[originId]) {
            originId = chains[originId]
          }
          // console.log('origin id', originId)
          const originEl = store.popups[originId]?.[0]
          if (originEl && src.contains(originEl)) {
            return true
          }
        }
      }
      return false
    }
    Vue.prototype.$ui = store
  }
}
