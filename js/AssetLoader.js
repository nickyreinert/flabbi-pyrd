// ============================
// ASSET LOADER
// ============================

class AssetLoader {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalAssets = Object.keys(ASSETS).length;
    }

    load(callback) {
        Object.keys(ASSETS).forEach(key => {
            const img = new Image();
            img.onload = () => {
                this.loadedCount++;
                if (this.loadedCount === this.totalAssets && callback) {
                    callback();
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load ${key} from ${ASSETS[key].src}, using fallback color`);
                this.loadedCount++;
                if (this.loadedCount === this.totalAssets && callback) {
                    callback();
                }
            };
            img.src = ASSETS[key].src;
            this.images[key] = img;
        });
    }

    isReady(key) {
        return this.images[key] && this.images[key].complete && this.images[key].naturalWidth > 0;
    }

    get(key) {
        return this.images[key];
    }
}
