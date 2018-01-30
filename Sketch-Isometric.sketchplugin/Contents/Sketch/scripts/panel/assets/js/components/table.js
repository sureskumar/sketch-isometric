(function () {
  
  var debugMode = false;

  var _submit,
    _close,
    send_rotate_side,
    send_depth,
    send_scale;

  _close = function () {
    var options = {};
    MDAction('closePanel', options);
  }

  _cancel = function () {
    var options = {};
    MDAction('cancelPanel', options);
  }

  var _sendVal = function (element, lessThan, sendVal) {
      if($(element).val().trim() < lessThan || isNaN($(element).val().trim())) {
        return sendVal;
      } else {
        return $(element).val().trim();
      }
  }

  _submit = function () {
  
      var options = {};          

      options.send_rotate_side = $('#rotate_side').val().trim();
      _superDebug("options.send_rotate_side", options.send_rotate_side);

      options.send_depth = _sendVal('#depth_txt', 0, 10000);
      _superDebug("options.send_depth", options.send_depth);

      options.send_scale = _sendVal('#scale_txt', 0.01, 100);
      _superDebug("options.send_scale", options.send_scale);

    
      MDAction('submit', options);
    
  }

    
    $('#close').on('click', _cancel);    
    $('#done').on('click', _close);    
    

    var _onChangeTrigger = function (element) {
      $(element).on('change',function() {
          _submit();  
      });
    }

    var _onChangeInput = function (element) {
      $(element).on('input',function() {
          _submit();  
      });
    }


// Input updates
_onChangeTrigger("#rotate_side");
_onChangeInput("#depth_txt");
_onChangeInput("#scale_txt");


var _superDebug = function (lbl, val) {
  if(debugMode) {
      console.log("SI - " + lbl + ": " + val);  
  }
}


$('#done').focus();

setTimeout(function () {
    _submit();  
}, 500);

})(jQuery);