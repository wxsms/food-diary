import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { debug } from '../../../../../utils/log.utils'
import { endOfMonth, endOfYear, startOfMonth, startOfYear } from '../../../../../utils/date.utils'
import { EXPORT_KINDS, exportAndDownloadRecords } from '../../../../../utils/export.utils'

Component({
  behaviors: [themeMixin, shareMixin],
  methods: {
    async onMonthChange ({ detail: { value } }) {
      const month = new Date(value)
      const monthTs = month.getTime()
      const monthStart = startOfMonth(monthTs)
      const monthEnd = endOfMonth(monthTs)
      await exportAndDownloadRecords({
        from: monthStart.ts,
        to: monthEnd.ts,
        kind: EXPORT_KINDS.MONTH
      })
    },
    async onYearChange ({ detail: { value } }) {
      const year = new Date(value)
      const yearTs = year.getTime()
      const yearStart = startOfYear(yearTs)
      const yearEnd = endOfYear(yearTs)
      await exportAndDownloadRecords({
        from: yearStart.ts,
        to: yearEnd.ts,
        kind: EXPORT_KINDS.YEAR
      })
    },
    async exportAll () {
      const to = new Date('9999-09-09')
      await exportAndDownloadRecords({
        from: 0,
        to: to.getTime(),
        kind: EXPORT_KINDS.ALL
      })
    }
  }
})
