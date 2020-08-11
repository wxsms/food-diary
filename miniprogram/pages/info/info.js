import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../mixins/theme.mixin'
import shareMixin from '../../mixins/share.mixin'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin]
})
