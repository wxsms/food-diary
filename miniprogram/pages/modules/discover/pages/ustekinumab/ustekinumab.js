import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import mabMixin from '../../mixins/mab.mixin'
import { MAB } from '../../../../../constants/constants'

Component({
  behaviors: [themeMixin, shareMixin, mabMixin],
  data: {
    mab: MAB.USTEKINUMAB
  }
})
