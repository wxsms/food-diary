import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { endOfMonth, endOfYear, startOfMonth, startOfYear } from '../../../../../utils/date.utils'
import { EXPORT_KINDS, exportAndDownloadRecords } from '../../../../../utils/export.utils'
import { loading, LOADING_TEXTS, toast } from '../../../../../utils/toast.utils';
import { promisify } from '../../../../../utils/promisify.utils';

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
    },
    async exportScd () {
      loading(true, LOADING_TEXTS.EXPORTING)
      const { result } = await wx.cloud.callFunction({
        name: 'export',
        data: { actionType: 'scd' }
      })
      if (typeof result !== 'string') {
        loading(false)
        if (result === -10001) {
          toast('限额已用完，请明日再试')
        } else if (result === -10002) {
          toast('该时间段无任何记录')
        }
        return
      }

      const { filePath } = await promisify(wx.downloadFile, {
        url: result,
        filePath: `${wx.env.USER_DATA_PATH}/IBD-Diary-scd.xlsx`
      })

      await promisify(wx.openDocument, {
        filePath: filePath,
        fileType: 'xlsx',
        showMenu: true
      })

      loading(false)
    }
  }
})
