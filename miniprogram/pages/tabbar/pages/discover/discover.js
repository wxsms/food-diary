import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../../../mixins/theme.mixin'
import shareMixin from '../../../../mixins/share.mixin'
import { MAB } from '../../../../constants/constants'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    mabs: Object.keys(MAB).map(k => MAB[k])
  }
})
