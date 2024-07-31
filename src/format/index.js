import Vue from 'vue'
import mapValues from 'lodash/mapValues'

import numberFormat from './number-format'
import datetimeFormaters from './datetime'
import { preformatFilesize } from './filesize'

const numeric = mapValues({
  perc: numberFormat('percent'),
  perc2: numberFormat('percent2'),
  num: numberFormat('num'),
  shortNum: numberFormat('shortNum'),
}, fn => fn.locale('en-US'))

const filesizeNumber = numberFormat('num1').locale('en-US')

export default Vue.observable({
  // date: v => v && format(utcToLocalDate(toDate(v)), 'dd.MM.yyyy'), // string ISO or Date in UTC
  // datetime: v => v && format(toDate(v), 'dd.MM.yyyy HH:mm'),
  ...datetimeFormaters,

  ...numeric,
  roundNum: numeric.num.pre(Math.round),
  truncNum: numeric.num.pre(Math.trunc),
  list: v => v?.join(', '),

  filesize: v => {
    if (Number.isFinite(v)) {
      const { value, unit } = preformatFilesize(v)
      return `${filesizeNumber(value)} ${unit}`
    }
    return v
  }
})
