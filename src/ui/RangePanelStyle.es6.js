import {StyleSet, styleRule} from "./Style";

class RangePanelStyle extends StyleSet {
    @styleRule
    default = {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
    };

    @styleRule
    tableContainer = {
        flex: "1",
        height: "100%",
        width: "100%",
        position: "relative",
    };

    @styleRule
    scrollablePanel = {
        overflow: "auto",
        height: "100%",
        width: "100%",
    };

    @styleRule
    fakePanel = {
        width: "100%",
        height: "2000px",
    };

    @styleRule
    footer = {
        fontWeight: "bold",
        textAlign: "center",
        position: "absolute",
        bottom: "0px",
        width: "100%",
    };

    @styleRule
    jumpToButton = {
        marginLeft: "5px",
        padding: "2.3px 10px",
        verticalAlign: "bottom",
    };

    @styleRule
    table = {
        marginBottom: "0px",
        top: "0px",
        position: "absolute",
        zIndex: "-1",
        ">tbody>tr>td": {
            height: "52px !important",
            whiteSpace: "nowrap !important",
        }
    };
}

export {RangePanelStyle};