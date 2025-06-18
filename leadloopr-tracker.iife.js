(function (c) {
    "use strict";

    function getConfig() {
        const config = window.__LEADLOOPR_CONFIG__;
        if (!config) throw new Error("LeadLoopr: window.__LEADLOOPR_CONFIG__ is not defined.");
        if (!config.orgId) throw new Error("LeadLoopr: orgId is missing.");
        if (!config.endpoint) throw new Error("LeadLoopr: endpoint is missing.");

        config.debug &&
            console.log("LeadLoopr: Config loaded", {
                orgId: config.orgId,
                debug: config.debug,
                endpoint: config.endpoint,
            });

        return config;
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
        let config;
        try {
            config = getConfig();
        } catch (err) {
            console.error("LeadLoopr: Initialization failed –", err.message);
            return;
        }

        config.debug && console.log("LeadLoopr: Starting initialization");

        const consent = getConsent(config.debug);
        if (!consent.granted) {
            config.debug && console.warn("LeadLoopr: Consent not granted");
            return;
        }

        getAttribution(config.debug);
    }

    // Auto-init
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    c.init = init;
})(this.LeadLooprTracker = this.LeadLooprTracker || {});
