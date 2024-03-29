import { loading, LOADING_TEXTS, toast, TOAST_ERRORS } from './toast.utils'
import { debug, error } from './log.utils'
import { promisify } from './promisify.utils'
import { format, FORMATS } from './date.utils'

export const EXPORT_KINDS = {
  ALL: () => 'All',
  MONTH: v => format(v, FORMATS.Y_M_SIMPLE),
  YEAR: v => format(v, FORMATS.Y_SIMPLE)
}

export async function exportAndDownloadRecords ({ from, to, kind = EXPORT_KINDS.MONTH }) {
  try {
    const rangeTip = from === 0 ? '全部' : `${format(from, FORMATS.Y_M)}至${format(to, FORMATS.Y_M)}`
    const { confirm } = await wx.showModal({
      title: '导出确认',
      content: `导出以下时间段的记录：\r\n${rangeTip}\r\n`
    })
    if (!confirm) {
      return
    }
    loading(true, LOADING_TEXTS.EXPORTING)
    const { result } = await wx.cloud.callFunction({
      name: 'export',
      data: { from, to }
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
    debug('wx.env.USER_DATA_PATH:', wx.env.USER_DATA_PATH)
    const { filePath } = await promisify(wx.downloadFile, {
      url: result,
      filePath: `${wx.env.USER_DATA_PATH}/IBD-Diary-${kind(from)}.xlsx`
    })
    debug('exported path:', filePath)
    await promisify(wx.openDocument, {
      filePath: filePath,
      fileType: 'xlsx',
      showMenu: true
    })
    loading(false)
  } catch (e) {
    error(e)
    loading(false)
    toast(TOAST_ERRORS.NETWORK_ERR)
  }
}
