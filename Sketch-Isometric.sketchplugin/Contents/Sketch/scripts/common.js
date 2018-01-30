//
//  Created by Sures Kumar
//  sureskumar.com
//  sures.srinivasan@gmail.com
//

var loop, 
ori_layer_name,
ori_layer_id, 
created_looper_group, 
ori_x, 
ori_y;
var opacity_val = 0;
var debugMode = false;

var layer, layerX, layerY, layerW, layerH;

var x;
var y;
var wx;
var wy;
var h;

var x1;
var y1;
var x2;
var y2;
var x3;
var y3;
var x4;
var y4;

var MD = {
  init: function (context, command, args) {
    var commandOptions = '' + args;
    this.prefs = NSUserDefaults.standardUserDefaults();
    this.context = context;
    this.version = this.context.plugin.version() + "";
    this.MDVersion = this.prefs.stringForKey("MDVersion") + "" || 0;
    this.extend(context);
    this.pluginRoot = this.scriptPath
      .stringByDeletingLastPathComponent()
      .stringByDeletingLastPathComponent()
      .stringByDeletingLastPathComponent();
    this.pluginSketch = this.pluginRoot + "/Contents/Sketch/scripts";
    this.resources = this.pluginRoot + '/Contents/Resources';
    coscript.setShouldKeepAround(false);
    if (command && command == "init") {
      return false;
    }
    this.document = context.document;
    this.documentData = this.document.documentData();
    this.UIMetadata = context.document.mutableUIMetadata();
    this.window = this.document.window();
    this.pages = this.document.pages();
    this.page = this.document.currentPage();
    this.artboard = this.page.currentArtboard();
    this.current = this.artboard || this.page;
    if (command) {
      switch (command) {
        case "generate-pattern":
          this.Pattern();
          break;
      }
    }
  },
  extend: function(options, target) {
    var target = target || this;
    for (var key in options) {
      target[key] = options[key];
    }
    return target;
  }
};

MD.extend({
    prefix: "MDConfig",
    getConfigs: function(container){
        var configsData;
        if(container){
            configsData = this.command.valueForKey_onLayer(this.prefix, container);
        }
        else{
            configsData = this.UIMetadata.objectForKey(this.prefix);
        }
        return JSON.parse(configsData);
    },
     setConfigs: function(newConfigs, container){
        var configsData;
        newConfigs.timestamp = new Date().getTime();
        if(container){
            configsData = this.extend(newConfigs, this.getConfigs(container) || {});
            this.command.setValue_forKey_onLayer(JSON.stringify(configsData), this.prefix, container);
        }
        else{
            configsData = this.extend(newConfigs, this.getConfigs() || {});
            this.UIMetadata.setObject_forKey (JSON.stringify(configsData), this.prefix);
        }
        var saveDoc = this.addShape();
        this.page.addLayers([saveDoc]);
        this.removeLayer(saveDoc);
        return configsData;
    },
    removeConfigs: function(container){
        if(container){
            this.command.setValue_forKey_onLayer(null, prefix, container);
        }
        else{
            configsData = this.UIMetadata.setObject_forKey (null, this.prefix);
        }
    }
});

MD.extend({
  addShape: function () {
    var shape = MSRectangleShape.alloc().initWithFrame(NSMakeRect(0, 0, 100, 100));
    return MSShapeGroup.shapeWithPath(shape);
  },
  removeLayer: function (layer) {
    var container = layer.parentGroup();
    if (container) container.removeLayer(layer);
  }
});

MD.extend({
  createCocoaObject: function (methods, superclass) {
    var uniqueClassName = "MD.sketch_" + NSUUID.UUID().UUIDString();
    var classDesc = MOClassDescription.allocateDescriptionForClassWithName_superclass_(uniqueClassName, superclass || NSObject);
    classDesc.registerClass();
    for (var selectorString in methods) {
      var selector = NSSelectorFromString(selectorString);
      [classDesc addInstanceMethodWithSelector:selector function:(methods[selectorString])];
    }
    return NSClassFromString(uniqueClassName).new();
  },

  addFirstMouseAcceptor: function (webView, contentView) {
    var button = this.createCocoaObject({
      'mouseDown:': function (evt) {
        this.removeFromSuperview();
        NSApplication.sharedApplication().sendEvent(evt);
      },
    }, NSButton);
    button.setIdentifier('firstMouseAcceptor');
    button.setTransparent(true);
    button.setTranslatesAutoresizingMaskIntoConstraints(false);
    contentView.addSubview(button);
    var views = {
      button: button,
      webView: webView
    };
    // Match width of WebView.
    contentView.addConstraints([NSLayoutConstraint
            constraintsWithVisualFormat:'H:[button(==webView)]'
            options:NSLayoutFormatDirectionLeadingToTrailing
            metrics:null
            views:views]);
    // Match height of WebView.
    contentView.addConstraints([NSLayoutConstraint
            constraintsWithVisualFormat:'V:[button(==webView)]'
            options:NSLayoutFormatDirectionLeadingToTrailing
            metrics:null
            views:views]);
    // Match top of WebView.
    contentView.addConstraints([[NSLayoutConstraint
            constraintWithItem:button attribute:NSLayoutAttributeTop
            relatedBy:NSLayoutRelationEqual toItem:webView
            attribute:NSLayoutAttributeTop multiplier:1 constant:0]]);
  },

  MDPanel: function (options) {
    var self = this,
      threadDictionary,
      options = this.extend(options, {
        url: this.pluginSketch + "/panel/chips.html",
        width: 240,
        height: 316,
        floatWindow: false,
        hiddenClose: false,
        data: {},
        callback: function (data) { return data; }
      }),
      result = false;
    options.url = encodeURI("file://" + options.url);
    var frame = NSMakeRect(0, 0, options.width, (options.height + 24)),
      titleBgColor = NSColor.colorWithRed_green_blue_alpha(0 / 255, 145 / 255, 234 / 255, 1),
      contentBgColor = NSColor.colorWithRed_green_blue_alpha(1, 1, 1, 1);
    if (options.identifier) {
      threadDictionary = NSThread.mainThread().threadDictionary();
    }
    if (options.identifier && threadDictionary[options.identifier]) {
      return false;
    }
    var Panel = NSPanel.alloc().init();
    Panel.setTitleVisibility(NSWindowTitleHidden);
    Panel.setTitlebarAppearsTransparent(true);
    Panel.standardWindowButton(NSWindowCloseButton).setHidden(options.hiddenClose);
    Panel.standardWindowButton(NSWindowMiniaturizeButton).setHidden(true);
    Panel.standardWindowButton(NSWindowZoomButton).setHidden(true);
    Panel.setFrame_display(frame, true);
    Panel.setBackgroundColor(contentBgColor);
    Panel.setWorksWhenModal(true);
    if (options.floatWindow) {
      Panel.becomeKeyWindow();
      Panel.setLevel(NSFloatingWindowLevel);
      threadDictionary[options.identifier] = Panel;
      // Long-running script
      COScript.currentCOScript().setShouldKeepAround_(true);
    }
    var contentView = Panel.contentView(),
      webView = WebView.alloc().initWithFrame(NSMakeRect(0, 0, options.width, options.height));
    var windowObject = webView.windowScriptObject();
    contentView.setWantsLayer(true);
    contentView.layer().setFrame(contentView.frame());
    webView.setBackgroundColor(contentBgColor);
    webView.setMainFrameURL_(options.url);
    contentView.addSubview(webView);
    var delegate = new MochaJSDelegate({
      "webView:didFinishLoadForFrame:": (function (webView, webFrame) {
        var MDAction = [
          "function MDAction(hash, data) {",
            "if(data){ window.MDData = encodeURI(JSON.stringify(data)); }",
            "window.location.hash = hash;",
          "}"
        ].join(""),
          DOMReady = [
            "$(", "function(){", "init(" + JSON.stringify(options.data) + ")", "}",");"
          ].join("");
        windowObject.evaluateWebScript(MDAction);
        windowObject.evaluateWebScript(DOMReady);
      }),
      "webView:didChangeLocationWithinPageForFrame:": (function (webView, webFrame) {
        var request = NSURL.URLWithString(webView.mainFrameURL()).fragment();
        if (request == "submit") {
          var data = JSON.parse(decodeURI(windowObject.valueForKey("MDData")));
          options.callback(data);
          result = true;
        }
        if (request == "closePanel") {
            windowObject.evaluateWebScript("window.location.hash = 'close';");
        }
        if (request == "cancelPanel") {
            var data = JSON.parse(decodeURI(windowObject.valueForKey("MDData")));
            options.callback(data, 1);
            result = true;
            windowObject.evaluateWebScript("window.location.hash = 'close';");
        }
        if (request == 'drag-end') {
          var data = JSON.parse(decodeURI(windowObject.valueForKey("MDData")));
          MD.Importer().convertSvgToSymbol(data);
          result = true;
        }
        if (request == 'onWindowDidBlur') {
          MD.addFirstMouseAcceptor(webView, contentView);
        }
        if (request == "close") {
          if (!options.floatWindow) {
            Panel.orderOut(nil);
            NSApp.stopModal();
          }
          else {
            Panel.close();
          }
        }
        if (request == "focus") {
          var point = Panel.currentEvent().locationInWindow(),
            y = NSHeight(Panel.frame()) - point.y - 24;
          windowObject.evaluateWebScript("lookupItemInput(" + point.x + ", " + y + ")");
        }
        windowObject.evaluateWebScript("window.location.hash = '';");
      })
    });
    webView.setFrameLoadDelegate_(delegate.getClassInstance());
    if (options.floatWindow) {
      Panel.center();
      Panel.makeKeyAndOrderFront(nil);
    }
    var closeButton = Panel.standardWindowButton(NSWindowCloseButton);
    closeButton.setCOSJSTargetFunction(function (sender) {
      var request = NSURL.URLWithString(webView.mainFrameURL()).fragment();
      if (options.floatWindow && request == "submit") {
        data = JSON.parse(decodeURI(windowObject.valueForKey("MDData")));
        options.callback(data);
      }
      if (options.identifier) {
        threadDictionary.removeObjectForKey(options.identifier);
      }
      self.wantsStop = true;
      if (options.floatWindow) {
        Panel.close();
      }
      else {
        Panel.orderOut(nil);
        NSApp.stopModal();
      }
    });
    closeButton.setAction("callAction:");
    var titlebarView = contentView.superview().titlebarViewController().view(),
    titlebarContainerView = titlebarView.superview();
    closeButton.setFrameOrigin(NSMakePoint(4, 4));
    titlebarContainerView.setFrame(NSMakeRect(0, options.height, options.width, 24));
    titlebarView.setFrameSize(NSMakeSize(options.width, 24));
    titlebarView.setTransparent(true);
    titlebarView.setBackgroundColor(titleBgColor);
    titlebarContainerView.superview().setBackgroundColor(titleBgColor);
    if (!options.floatWindow) {
      NSApp.runModalForWindow(Panel);
    }
    return result;
  },

  patternPanel: function () {
    var self = this,
      data = {};
    var loopedOnce = 0;
    return this.MDPanel({
      url: this.pluginSketch + "/panel/table.html",
      width: 130,
      height: 127,
      data: data,
      identifier: 'com.google.material.pattern',
      floatWindow: false,
      callback: function (data, cl) {
        self.configs = self.setConfigs({
          table: data
        });
        if(self.configs) {  
            if(loopedOnce == 1) {
                  var layers = MD.page.layers()
                  for (var ia=0; ia < [layers count]; ia++) {
                      var layer = [layers objectAtIndex:ia]
                      if(layer.objectID() == created_looper_group){
                        layer.removeFromParent()
                      }
                  }
                  if(cl != 1) { 
                      MD.runLooper(layer);
                  }
              } else {
                  loopedOnce = 1;
                  MD.runLooper();
              } 
        }
      },
    });
  },

  runLooper: function () {

    selection = MD.context.selection;

    // Create a group
    groupLayer = MSLayerGroup.new();
    var group_new_name = ori_layer_name + "_Isometric";
    groupLayer.setName(group_new_name);
    created_looper_group = groupLayer.objectID();
      
    var rotate_side_receive = MD.configs.table.send_rotate_side;
    MD.superDebug("rotate_side_receive", rotate_side_receive);

    var depth_receive = MD.configs.table.send_depth;
    MD.superDebug("depth_receive", depth_receive);

    var scale_receive = MD.configs.table.send_scale;
    MD.superDebug("scale_receive", scale_receive);

    var depth = parseFloat(depth_receive);
    var scale = parseFloat(scale_receive);

    // Calculate co-ordinates
    x = layerX;
    y = layerY;
    wx = layerH * scale * 1; //height
    wy = layerW * scale * 1; //width
    h = depth;

    if(rotate_side_receive == "Rotate_Left") {
        //Left
        x1 = x;
        y1 = y;
        x2 = x - wx;
        y2 = y - wx * 0.5;
        x3 = x - wx;
        y3 = y - h - wx * 0.5;
        x4 = x;
        y4 = y - h * 1;
        MD.drawBorder ("Left");


        x1 = x;
        y1 = y;
        x2 = x + wy;
        y2 = y - wy * 0.5;
        x3 = x + wy;
        y3 = y - h - wy * 0.5;
        x4 = x;
        y4 = y - h * 1;
        MD.drawBorder ("Right");

        
        x4 = x;
        y4 = y - h;
        x1 = x - wx;
        y1 = y - h - wx * 0.5;
        x2 = x - wx + wy;
        y2 = y - h - (wx * 0.5 + wy * 0.5);
        x3 = x + wy;
        y3 = y - h - wy * 0.5;
        MD.drawBorder ("Top");
    } else {
        //Right
        x1 = x;
        y1 = y;
        x2 = x + wx;
        y2 = y - wx * 0.5;
        x3 = x + wx;
        y3 = y - h - wx * 0.5;
        x4 = x;
        y4 = y - h * 1;
        MD.drawBorder ("Right");


        x1 = x;
        y1 = y;
        x2 = x - wy;
        y2 = y - wy * 0.5;
        x3 = x - wy;
        y3 = y - h - wy * 0.5;
        x4 = x;
        y4 = y - h * 1;
        MD.drawBorder ("Left");

        x4 = x;
        y4 = y - h;
        x1 = x + wx;
        y1 = y - h - wx * 0.5;
        x2 = x + wx - wy;
        y2 = y - h - (wx * 0.5 + wy * 0.5);
        x3 = x - wy;
        y3 = y - h - wy * 0.5;
        MD.drawBorder ("Top");
    }


    this.document.currentPage().addLayers([groupLayer]);
    groupLayer.resizeToFitChildrenWithOption(0);

    var Group_W = groupLayer.frame().width();
    MD.superDebug("Group_W", Group_W);

    var Group_H = groupLayer.frame().height();
    MD.superDebug("Group_H", Group_H);

    var Group_X = layerX + layerW + 50;
    MD.superDebug("Group_X", Group_X);

    var Group_Y = layerY;
    MD.superDebug("Group_Y", Group_Y);

    groupLayer.frame().setX(Group_X);
    groupLayer.frame().setY(Group_Y);

  },

  drawBorder: function(pos) {

    var path = NSBezierPath.bezierPath();
    path.moveToPoint(NSMakePoint(x1, y1));
    path.lineToPoint(NSMakePoint(x2, y2));
    path.lineToPoint(NSMakePoint(x3, y3));
    path.lineToPoint(NSMakePoint(x4, y4));
    path.closePath();

    var shape = MSShapeGroup.shapeWithBezierPath(path);
    var border = shape.style().addStylePartOfType(0);
    var color1 = MSColor.colorWithRed_green_blue_alpha(0.38, 0.38, 0.38, 1.0);
    var color2 = MSColor.colorWithRed_green_blue_alpha(0.61, 0.61, 0.61, 1.0);
    var color3 = MSColor.colorWithRed_green_blue_alpha(0.87, 0.87, 0.87, 1.0);
    
    if(pos == "Left") {
      border.color = color1;
    }
    if(pos == "Right") {
      border.color = color2;
    }
    if(pos == "Top") {
      border.color = color3;
    }

    var temp_name = ori_layer_name + "_" + pos + "_Isometric";
    shape.setName(temp_name);
    groupLayer.addLayer(shape);

  },

  superDebug: function( lbl, val )
  {
      if(debugMode) {
        log("SKETCH ISOMETRIC - " + lbl + ": " + val);  
      }
  }


});



MD["Pattern"] = function()
{
    var self = MD,
    selection = MD.context.selection;   
    var self = this;


    this.scriptPath = MD.context.scriptPath;
    this.scriptPathRoot = this.scriptPath.stringByDeletingLastPathComponent();
    this.scriptResourcesPath = this.scriptPathRoot.stringByDeletingLastPathComponent() + '/Resources';
    var icon = NSImage.alloc().initByReferencingFile(this.scriptResourcesPath + '/' + "icon.png");


    var runPLugin = function()
    {
        if (selection.count() <= 0) {
          sendEvent(MD.context, 'Error', 'No artboard selected');
          showDialog("Sketch Isometric", "Please select an artboard or rectangle to generate isometric view. Cheers!");
        } else if(selection.count() > 1) {
          sendEvent(MD.context, 'Error', 'More than 1 artboard selected');
          showDialog("Sketch Isometric", "Please select only one artboard or rectangle to generate isometric view. Cheers!");
        } else {
              var layer = selection[0];
              ori_layer_id = layer.objectID();
              ori_layer_name = layer.name();
              
                  var rect = layer.absoluteRect();

                  layerX = rect.x();
                  superDebug("layerX", layerX);
                  
                  layerY = rect.y();
                  superDebug("layerY", layerY);
                  
                  layerW = rect.width();
                  superDebug("layerW", layerW);
                  
                  layerH = rect.height();
                  superDebug("layerH", layerH);

                  /*
                  if(MD.artboard) {
                    var alayer = MD.artboard;
                    var arect = alayer.absoluteRect();

                    var alayerX = arect.x();
                    superDebug("alayerX", alayerX);
                    
                    var alayerY = arect.y();
                    superDebug("alayerY", alayerY); 

                    layerX = layerX - alayerX;
                    layerY = layerY - alayerY;
                  }
                  */

              sendEvent(MD.context, 'Success', 'UI Modal opened');
              MD.patternPanel();
        }      
    }

    var superDebug = function( lbl, val )
    {
        if(debugMode) {
          log("SKETCH ISOMETRIC - " + lbl + ": " + val);  
        }
    }

    var showDialog = function(title, informativeText) {
      var alert = [[NSAlert alloc] init]
      [alert setMessageText: title]
      [alert setInformativeText: informativeText]
      [alert addButtonWithTitle: "OK"] // 1000
      alert.setIcon(icon);
      var responseCode = [alert runModal]
    }

  runPLugin();
}

var kUUIDKey = 'google.analytics.uuid'
var uuid = NSUserDefaults.standardUserDefaults().objectForKey(kUUIDKey)
if (!uuid) {
  uuid = NSUUID.UUID().UUIDString()
  NSUserDefaults.standardUserDefaults().setObject_forKey(uuid, kUUIDKey)
}

function jsonToQueryString(json) {
  return '?' + Object.keys(json).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
  }).join('&')
}

var index = function (context, trackingId, hitType, props) {
  var payload = {
    v: 1,
    tid: trackingId,
    ds: 'Sketch%20' + NSBundle.mainBundle().objectForInfoDictionaryKey("CFBundleShortVersionString"),
    cid: uuid,
    t: hitType,
    an: context.plugin.name(),
    aid: context.plugin.identifier(),
    av: context.plugin.version()
  }
  if (props) {
    Object.keys(props).forEach(function (key) {
      payload[key] = props[key]
    })
  }

  var url = NSURL.URLWithString(
    NSString.stringWithFormat("https://www.google-analytics.com/collect%@", jsonToQueryString(payload))
  )

  if (url) {
    NSURLSession.sharedSession().dataTaskWithURL(url).resume()
  }
}

var key = 'UA-113145849-1';
var sendEvent = function (context, category, action, label) {
  //log("GA called");
  var payload = {};
  payload.ec = category;
  payload.ea = action;
  return index(context, key, 'event', payload);
}