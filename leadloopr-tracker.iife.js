(function (c) {
    "use strict";

    const TRACKER_ID = "leadloopr-tracker";
    const ATTR_ORG_ID = "data-org-id";
    const ATTR_DEBUG = "data-debug";
    const ATTR_ENDPOINT = "data-endpoint";

    function getScriptTag() {
        return (
            document.getElementById(TRACKER_ID) ||
            Array.from(document.getElementsByTagName("script")).find((el) =>
                el.src.includes("leadloopr-tracker")
            )
        );
    }

    function getConfig() {
        const script = getScriptTag();
        if (!script) throw new Error("LeadLoopr: Script tag not found");
        const orgId = script.getAttribute(ATTR_ORG_ID);
        const debug =
            script.getAttribute(ATTR_DEBUG) === "true" || window.LEADLOOPR_DEBUG === true;
        const endpoint = script.getAttribute(ATTR_ENDPOINT);

        if (!orgId) throw new Error("LeadLoopr: org-id missing");
        if (!endpoint) throw new Error("LeadLoopr: endpoint missing");

        debug &&
            console.log("LeadLoopr: Config loaded", {
                orgId,
                debug,
                endpoint,
            });

        return { orgId, debug, endpoint };
    }

    function getConsent(debug) {
        const cookieConsent = document.cookie.includes("cookie_consent=true");
        debug &&
            console.log(
                "LeadLoopr: Consent " +
                (cookieConsent ? "granted via cookie" : "not granted")
            );
        return { granted: cookieConsent, reason: cookieConsent ? "cookie" : "none" };
    }

    function getAttribution(debug) {
        debug && console.log("LeadLoopr: Initializing attribution tracking");
        const landing_page = window.location.href;
        const timestamp = Date.now();
        return { landing_page, timestamp };
    }

    async function init() {
        const config = getConfig();
        config.debug && console.log("LeadLoopr: Starting initialization");

        const consent = getConsent(config.debug);
        if (!consent.granted) {
            config.debug && console.warn("LeadLoopr: Consent not granted");
            return;
        }

        getAttribution(config.debug);
    }

    // Auto-init
    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", init)
        : init();

    // Export if needed
    c.init = init;
})(this.LeadLooprTracker = this.LeadLooprTracker || {});
