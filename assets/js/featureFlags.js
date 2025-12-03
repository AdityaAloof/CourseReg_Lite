(function(global) {
    const STORAGE_KEY = 'crl_feature_flags';
    const DEFAULT_FLAGS = {
        dynamicCatalog: true,
        strictAuthGuards: true
    };

    function readOverrides() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {};
        }
        try {
            return JSON.parse(raw) || {};
        } catch (error) {
            console.warn('Feature flag overrides are corrupted. Resetting.', error);
            localStorage.removeItem(STORAGE_KEY);
            return {};
        }
    }

    let overrides = readOverrides();
    let effectiveFlags = applyOverrides(overrides);

    function applyOverrides(currentOverrides) {
        return Object.assign({}, DEFAULT_FLAGS, currentOverrides || {});
    }

    function persist(newOverrides) {
        const keys = Object.keys(newOverrides);
        if (keys.length === 0) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newOverrides));
    }

    function refreshFlags() {
        overrides = readOverrides();
        effectiveFlags = applyOverrides(overrides);
    }

    function get(name) {
        return Object.prototype.hasOwnProperty.call(effectiveFlags, name)
            ? effectiveFlags[name]
            : undefined;
    }

    function set(name, value) {
        overrides[name] = value;
        persist(overrides);
        refreshFlags();
        return get(name);
    }

    function reset() {
        overrides = {};
        localStorage.removeItem(STORAGE_KEY);
        refreshFlags();
        return Object.assign({}, effectiveFlags);
    }

    global.FeatureFlags = {
        get,
        set,
        reset,
        all: () => Object.assign({}, effectiveFlags)
    };

    window.addEventListener('storage', function(event) {
        if (event.key === STORAGE_KEY) {
            refreshFlags();
        }
    });
})(window);
