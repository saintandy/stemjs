import {UI} from "../UIBase";
import {Switcher} from "../Switcher";
import {Link} from "../UIPrimitives";
import {SingleActiveElementDispatcher} from "../../base/Dispatcher";
import {registerStyle} from "../style/Theme";
import {DefaultTabAreaStyle} from "./Style";

class BasicTabTitle extends Link {
    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.tab);
        if (this.options.active) {
            attr.addClass(this.styleSheet.activeTab);
        }
    }

    getDefaultOptions() {
        return {
            newTab: false,
        }
    }

    canOverwrite(existingElement) {
        // Disable reusing with different panels, since we want to attach listeners to the panel
        return super.canOverwrite(existingElement) && this.options.panel === existingElement.options.panel;
    }

    setActive(active) {
        this.options.active = active;
        this.redraw();
        if (active) {
            this.options.activeTabDispatcher.setActive(this.getPanel(), () => {
                this.setActive(false);
            });
        }
    }

    getPanel() {
        return this.options.panel;
    }

    getTitle() {
        if (this.options.title) {
            return this.options.title;
        }
        let panel = this.getPanel();
        if (typeof panel.getTitle === "function") {
            return panel.getTitle();
        }
        return panel.options.title;
    }

    render() {
        return [this.getTitle()];
    }

    onMount() {
        super.onMount();

        if (this.options.active) {
            this.setActive(true);
        }

        this.addClickListener(() => {
            this.setActive(true);
        });

        if (this.options.panel && this.options.panel.addListener) {
            this.attachListener(this.options.panel, "show", () => {
                this.setActive(true);
            });
        }
    }
};

class TabTitleArea extends UI.Element {
};

@registerStyle(DefaultTabAreaStyle)
class TabArea extends UI.Element {
    activeTabDispatcher = new SingleActiveElementDispatcher();

    getDefaultOptions() {
        return {
            autoActive: true, // means the first Tab will be automatically selected
            // lazyRender: true, // TODO: should be true by default
        }
    }

    extraNodeAttributes(attr) {
        attr.addClass(this.styleSheet.tabArea);
    }

    createTabPanel(panel) {
        let tab = <BasicTabTitle panel={panel} activeTabDispatcher={this.activeTabDispatcher}
                                 active={panel.options.active} href={panel.options.tabHref}
                                 styleSheet={this.styleSheet} />;

        return [tab, panel];
    }

    appendChild(panel, doMount) {
        let [tabTitle, tabPanel] = this.createTabPanel(panel);

        this.options.children.push(panel);

        this.titleArea.appendChild(tabTitle);
        this.switcherArea.appendChild(tabPanel, doMount || !this.options.lazyRender);
    };

    getTitleArea(tabTitles) {
        return <TabTitleArea ref="titleArea" className={this.styleSheet.nav}>
            {tabTitles}
        </TabTitleArea>;
    }

    getSwitcher(tabPanels) {
        return <Switcher className={this.styleSheet.switcher} ref="switcherArea" lazyRender={this.options.lazyRender}>
            {tabPanels}
        </Switcher>;
    }

    render() {
        let tabTitles = [];
        let tabPanels = [];
        let activeTab;

        for (let panel of this.getGivenChildren()) {
            let [tabTitle, tabPanel] = this.createTabPanel(panel);

            if (tabTitle.options.active) {
                activeTab = tabTitle;
            }

            tabTitles.push(tabTitle);
            tabPanels.push(tabPanel);
        }

        if (this.options.autoActive && !activeTab && tabTitles.length > 0) {
            tabTitles[0].options.active = true;
        }

        return [
            this.getTitleArea(tabTitles),
            this.getSwitcher(tabPanels),
        ];
    };

    setActive(panel) {
        this.activeTabDispatcher.setActive(panel);
    }

    getActive() {
        return this.activeTabDispatcher.getActive();
    }

    onSetActive(panel) {
        this.switcherArea.setActive(panel);
    }

    onMount() {
        this.attachListener(this.activeTabDispatcher, (panel) => {
            this.onSetActive(panel);
        });

        this.addListener("resize", () => {
            this.switcherArea.dispatch("resize");
        });
    }
};

export * from "./Style";
export {TabTitleArea, BasicTabTitle, TabArea};
