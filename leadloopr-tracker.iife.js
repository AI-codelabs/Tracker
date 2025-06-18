(function (c) {
    "use strict";
    const g = "leadloopr-tracker", l = "data-org-id", m = "data-debug", u = "data-endpoint";

    function L() {
        const e = document.getElementById(g);
        return (e?.tagName) === "SCRIPT" ? e : Array.from(document.getElementsByTagName("script")).find(o => o.src.includes("leadloopr-tracker")) || null;
    }

    function p(e) {
        const t = e.getAttribute(l);
        if (!t) throw new Error(`LeadLoopr: Missing required attribute "${l}" on script tag`);
        return t;
    }

    function _(e) {
        return e.getAttribute(m) === "true" || window.LEADLOOPR_DEBUG === !0;
    }

    function U(e) {
        return e.getAttribute(u) || "https://api.leadloopr.com/track/lead";
    }

    function h() {
        const e = L();
        if (!e) throw new Error("LeadLoopr: Could not find tracker script tag");
        const t = {
            orgId: p(e),
            debug: _(e),
            endpoint: U(e)
        };
        t.debug && console.log("LeadLoopr: Config loaded", t);
        return t;
    }

    const E = "cookie_consent", w = "leadloopr_consent";

    function b() {
        return new Promise(e => {
            if (typeof window.gtag != "function") {
                e({ granted: false, reason: "none" });
                return;
            }
            window.gtag("consent", "get", t => {
                const o = (t?.ad_storage) === "granted" || (t?.analytics_storage) === "granted" || (t?.functionality_storage) === "granted";
                e({ granted: o, reason: o ? "google-consent" : "none" });
            });
        });
    }

    function y() {
        const t = document.cookie.split(";").some(o => o.trim().startsWith(`${E}=true`));
        return { granted: t, reason: t ? "fallback-cookie" : "none" };
    }

    function C() {
        const e = localStorage.getItem(w) === "true";
        return { granted: e, reason: e ? "fallback-localStorage" : "none" };
    }

    async function S(e = false) {
        e && console.log("LeadLoopr: Checking consent status...");
        const t = await b();
        if (t.granted) return e && console.log("LeadLoopr: Consent granted via Google Consent Mode"), t;
        const o = y();
        if (o.granted) return e && console.log("LeadLoopr: Consent granted via cookie"), o;
        const r = C();
        return r.granted ? (e && console.log("LeadLoopr: Consent granted via localStorage"), r) : (e && console.log("LeadLoopr: No consent granted"), { granted: false, reason: "none" });
    }

    const I = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"],
        k = ["gclid", "fbclid", "li_fat_id"];

    function T(e) {
        try {
            const t = new URLSearchParams(new URL(e).search), o = {};
            I.forEach(r => { const n = t.get(r); if (n) o[r] = n; });
            k.forEach(r => { const n = t.get(r); if (n) o[r] = n; });
            return o;
        } catch (t) {
            console.warn("LeadLoopr: Failed to parse URL parameters:", t);
            return {};
        }
    }

    function A() {
        const e = document.referrer;
        if (e && !e.startsWith(window.location.origin)) return e;
    }

    function D(e = false) {
        e && console.log("LeadLoopr: Initializing attribution tracking");
        const t = window.location.href, o = T(t), r = A();
        const n = { ...o, referrer: r, landing_page: t, timestamp: Date.now() };
        e && console.log("LeadLoopr: Attribution data captured:", n);
        return n;
    }

    const O = ["name", "full_name", "first_name", "last_name", "email", "user_email", "phone", "tel", "telephone", "mobile", "cell"];

    function R(e) {
        const t = e.toLowerCase().replace(/[_-]/g, "");
        return O.some(o => t.includes(o.toLowerCase().replace(/[_-]/g, "")));
    }

    function P(e, t, o = false) {
        if (o && console.log("LeadLoopr: Filtering form data for consent:", { consent: t, rawData: e }), t.granted)
            return o && console.log("LeadLoopr: Consent granted, including all data"), { data: e, excluded: [] };
        const r = {}, n = [];
        Object.entries(e).forEach(([a, i]) => {
            if (i && !R(a)) r[a] = i;
            else if (i) n.push(a);
        });
        o && console.log("LeadLoopr: Consent not granted, filtered data:", { included: Object.keys(r), excluded: n });
        return { data: r, excluded: n };
    }

    const d = 3, N = [500, 1500, 3000];

    async function v(e) {
        return new Promise(t => setTimeout(t, e));
    }

    async function $(e, t, o, r) {
        try {
            const n = await fetch(t, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "omit",
                body: JSON.stringify(e)
            });
            if (!n.ok) throw new Error(`HTTP error! status: ${n.status}`);
            r && console.log("LeadLoopr: Lead payload sent successfully");
            return true;
        } catch (n) {
            r && console.warn(`LeadLoopr: Send attempt ${o} failed:`, n);
            return false;
        }
    }

    async function M(e, t = false, o) {
        t && console.log("LeadLoopr: Sending lead payload:", e);
        let r = false, n = 0;
        while (!r && n < d) {
            if (n > 0) {
                const a = N[n - 1];
                t && console.log(`LeadLoopr: Retrying in ${a}ms (attempt ${n + 1}/${d})`);
                await v(a);
            }
            r = await $(e, o, n + 1, t);
            n++;
        }
        !r && t && console.error("LeadLoopr: Failed to send lead payload after all retries");
    }

    const z = {
        name: ["name", "full_name", "first_name", "last_name", "fullname", "fullName"],
        email: ["email", "user_email", "userEmail", "e-mail", "mail"],
        phone: ["phone", "tel", "telephone", "mobile", "cell"]
    };

    function j(e) {
        const t = new FormData(e), o = {};
        Object.entries(z).forEach(([r, n]) => {
            const a = e.querySelector(`[name="${n[0]}"], [id="${n[0]}"], [name*="${n[0]}"], [id*="${n[0]}"]`);
            if (a && a.value) o[r] = a.value.trim();
        });
        t.forEach((r, n) => {
            if (typeof r === "string" && r.trim()) o[n] = r.trim();
        });
        return o;
    }

    async function f(e, t, o, r) {
        e.preventDefault(); // ✅ Prevent form from reloading the page
        const n = e.target;
        if (n.hasAttribute("data-leadloopr-tracked")) return;
        n.setAttribute("data-leadloopr-tracked", "true");
        const a = j(n), { data: i, excluded: s } = P(a, r, t.debug);
        t.debug && console.log("LeadLoopr: Form submitted:", {
            form: n.id || n.name || "unnamed",
            rawData: a,
            filteredData: i,
            excluded: s,
            attribution: o
        });
        await M({
            org_id: t.orgId,
            timestamp: Date.now(),
            attribution: o,
            consent: r,
            form_data: i
        }, t.debug, t.endpoint);
    }

    function G(e, t, o) {
        e.debug && console.log("LeadLoopr: Initializing form tracking");
        const r = document.querySelectorAll("form");
        e.debug && console.log(`LeadLoopr: Found ${r.length} forms to track`);
        r.forEach(a => {
            a.addEventListener("submit", i => f(i, e, t, o));
        });
        new MutationObserver(a => {
            a.forEach(i => {
                i.addedNodes.forEach(s => {
                    if (s instanceof HTMLElement)
                        s.querySelectorAll("form").forEach(form => {
                            if (!form.hasAttribute("data-leadloopr-tracked"))
                                form.addEventListener("submit", evt => f(evt, e, t, o));
                        });
                });
            });
        }).observe(document.body, { childList: true, subtree: true });
        e.debug && console.log("LeadLoopr: Form tracking initialized");
    }

    async function B(e) {
        e.debug && console.log("LeadLoopr: Starting initialization");
        const t = await S(e.debug);
        if (!t.granted) {
            e.debug && console.log("LeadLoopr: Consent not granted, reason:", t.reason);
            return;
        }
        const o = D(e.debug);
        G(e, o, t);
        e.debug && console.log("LeadLoopr: Initialization complete");
    }

    function q() {
        if (window.__LEADLOOPR_INITIALIZED__) {
            console.warn("LeadLoopr: Script already initialized");
            return;
        }
        const e = async () => {
            try {
                const t = h();
                await B(t);
                window.__LEADLOOPR_INITIALIZED__ = true;
            } catch (t) {
                console.error("LeadLoopr: Initialization failed:", t);
            }
        };
        document.readyState === "loading"
            ? document.addEventListener("DOMContentLoaded", e)
            : e();
    }

    const x = () => { q(); };
    c.init = x;
    Object.defineProperty(c, Symbol.toStringTag, { value: "Module" });
})(this.LeadLooprTracker = this.LeadLooprTracker || {});

// ✅ Auto-start when script loads
this.LeadLooprTracker.init();
