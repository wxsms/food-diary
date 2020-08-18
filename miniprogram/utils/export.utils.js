import { loading, toast, TOAST_ERRORS } from './toast.utils'
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
    loading(true, '导出中...')
    const { result } = await wx.cloud.callFunction({
      name: 'export',
      data: { from, to }
    })
    if (!result) {
      loading(false)
      toast('当前时间段没有可导出的记录')
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