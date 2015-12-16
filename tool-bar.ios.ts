import common = require("./tool-bar-common");
import { IOSToolBarItemSettings, ToolBarItem as ToolBarItemDefinition } from "tool-bar";
import { layout } from "utils/utils";
import { isNumber } from "utils/types";
import { View } from "ui/core/view";
import { fromFileOrResource } from "image-source";

global.moduleMerge(common, exports);

export class ToolBarItem extends common.ToolBarItem {
    private _ios: IOSToolBarItemSettings = {
        systemIcon: undefined
    };
    
    public get ios(): IOSToolBarItemSettings {
        return this._ios;
    }
    public set ios(value: IOSToolBarItemSettings) {
        throw new Error("ToolBarItem.ios is read-only");
    }
}

export class ToolBar extends common.ToolBar {
    
    private _ios: UIToolbar;
    
    constructor() {
        super();
        this._ios = UIToolbar.alloc().initWithFrame(CGRectZero);
    }
    
    public update() {
		var items = this.barItems.getVisibleItems();
		console.log(`no of items : ${items.length}`);
        var itemsArray : NSMutableArray = NSMutableArray.new();
        for (var i = 0; i < items.length; i++) {
            itemsArray.addObject(this.createBarButtonItem(items[i]));
        }
        this.ios.items = itemsArray;
        // update colors explicitly - they may have to be cleared form a previous page
        this.updateColors(this._ios);
    }

    private createBarButtonItem(item: ToolBarItemDefinition): UIBarButtonItem {
        var tapHandler = TapToolBarItemHandlerImpl.initWithOwner(new WeakRef(item));
        // associate handler with menuItem or it will get collected by JSC.
        (<any>item).handler = tapHandler;

        var barButtonItem: UIBarButtonItem;

        if (isNumber(item.ios.systemIcon)) {
            barButtonItem = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(item.ios.systemIcon, tapHandler, "tap");
        }
        else if (item.icon) {
            var img = fromFileOrResource(item.icon);
            if (img && img.ios) {
                barButtonItem = UIBarButtonItem.alloc().initWithImageStyleTargetAction(img.ios, UIBarButtonItemStyle.UIBarButtonItemStylePlain, tapHandler, "tap");
            }
            else {
                throw new Error("Error loading icon from " + item.icon);
            }
        }
        else {
            barButtonItem = UIBarButtonItem.alloc().initWithTitleStyleTargetAction(item.text + "", UIBarButtonItemStyle.UIBarButtonItemStylePlain, tapHandler, "tap");
        }

        return barButtonItem;
    }

    private updateColors(toolbar: UIToolbar) {
        var color = this.color;
        if (color) {
            toolbar.tintColor = color.ios;
        }
        else {
            toolbar.tintColor = null;
        }

        var bgColor = this.backgroundColor;
        toolbar.barTintColor = bgColor ? bgColor.ios : null;
    }

    public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number) {

        let width = layout.getMeasureSpecSize(widthMeasureSpec);
        let widthMode = layout.getMeasureSpecMode(widthMeasureSpec);

        let height = layout.getMeasureSpecSize(heightMeasureSpec);
        let heightMode = layout.getMeasureSpecMode(heightMeasureSpec);
        let newHeight = height;
        
        let navBarWidth = 0;
        let navBarHeight = 0;

        if (heightMode != layout.EXACTLY) {
            let toolbarSize = this._ios.intrinsicContentSize();
            newHeight = toolbarSize.height;
            heightMode = layout.EXACTLY;
        }

        var heightAndState = View.resolveSizeAndState(height, newHeight, heightMode, 0);
        this.setMeasuredDimension(widthMeasureSpec, heightAndState);
    }

    public _shouldApplyStyleHandlers() {
        return true;
    }
    
    get ios() : UIToolbar {
        return this._ios;
    }
}

class TapToolBarItemHandlerImpl extends NSObject {
    private _owner: WeakRef<ToolBarItemDefinition>;

    public static initWithOwner(owner: WeakRef<ToolBarItemDefinition>): TapToolBarItemHandlerImpl {
        let handler = <TapToolBarItemHandlerImpl>TapToolBarItemHandlerImpl.new();
        handler._owner = owner;
        return handler;
    }

    public tap(args) {
        let owner = this._owner.get();
        if (owner) {
            owner._raiseTap();
        }
    }

    public static ObjCExposedMethods = {
        "tap": { returns: interop.types.void, params: [interop.types.id] }
    };
}