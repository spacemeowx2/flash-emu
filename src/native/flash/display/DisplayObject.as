package flash.display {
  import flash.events.EventDispatcher;
  [native(cls='DisplayObjectClass')]
  public class DisplayObject extends EventDispatcher {
    public function DisplayObject() {
      super()
    }
    public native function get stage():Object;
  }
}
