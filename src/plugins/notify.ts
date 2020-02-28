import Vue, { VueConstructor } from "vue";

export class NotifyPlugin {
  text: string | null = null;
  color?: string;
  show: boolean = false;

  send({ text, color }: { text: string; color?: string }) {
    this.text = text;
    this.color = color;
    this.show = true;
  }

  static install(_Vue: VueConstructor) {
    _Vue.mixin({
      beforeCreate() {
        if (this.$options.notify) {
          this.$notify = _Vue.observable(this.$options.notify);
        } else {
          if (this.$options.parent && this.$options.parent.$notify) {
            this.$notify = this.$options.parent.$notify;
          }
        }
      }
    });
  }
}

Vue.use(NotifyPlugin);

export default new NotifyPlugin();
