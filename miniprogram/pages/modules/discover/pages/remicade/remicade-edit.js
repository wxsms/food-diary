import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'

Component({
  behaviors: [themeMixin, shareMixin],
  data: {
    id: '',
    loaded: false
  },
  methods: {
    onLoad ({ id }) {
      this.setData({ id: id || null, loaded: true })
    }
  }
})
