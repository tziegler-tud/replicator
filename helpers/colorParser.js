export default class ColorParser {
    constructor({maxBrightness = 1}={}){
        this.maxBrightness = maxBrightness;
    }

    /**
     *
     * @param x {Number} x value, 0-1
     * @param y {Number} y value 0-1
     * @param bri {Number} brightness value, 0 - maxBrightness (default 1)
     * @returns {{r: number, b: number, g: number}}
     */
    xyBriToRgb({x, y, bri=this.maxBrightness}={})
    {
        let r,g,b,z,X,Y,Z;
        z = 1.0 - x - y;

        Y = bri/this.maxBrightness; // Brightness of lamp, range 0-1
        X = (Y / y) * x;
        Z = (Y / y) * z;
        r =  X * 1.656492 - Y * 0.354851 - Z * 0.255038;
        g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
        b = b =  X * 0.051713 - Y * 0.121364 + Z * 1.011530;
        r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
        g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
        b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
        let maxValue = Math.max(r,g,b);
        r /= maxValue;
        g /= maxValue;
        b /= maxValue;
        r = r * 255;
        if (r < 0) { r = 255 }
        g = g * 255;
        if (g < 0) { g = 255 }
        b = b * 255;
        if (b < 0) { b = 255 }

        return {r:r ,g:g, b:b};
    }

    /**
     *
     * @param r {Number} red value, 0 - 255
     * @param g {Number} green value, 0 - 255
     * @param b {Number} blue value, 0 - 255
     * @returns {{x: number, y: number, bri: number}}
     */
    rgbToXYBri({r=0,g=0,b=0}={})
    {
        //convert to range[0-1]
        r = r/255;
        g = g/255;
        b = b/255;

        r = r > 0.04045 ? Math.pow((r + 0.055) / (1.0 + 0.055), 2.4) : (r / 12.92);
        g = g > 0.04045 ? Math.pow((g + 0.055) / (1.0 + 0.055), 2.4) : (g / 12.92);
        b = b > 0.04045 ? Math.pow((b + 0.055) / (1.0 + 0.055), 2.4) : (b / 12.92);

        let X = r * 0.4124 + g * 0.3576 + b * 0.1805;
        let Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        let Z = r * 0.0193 + g * 0.1192 + b * 0.9505;

        let x = X / (X + Y + Z);
        let y = Y / (X + Y + Z);
        let relBri = Y; // 0 - 1
        const brightness = relBri * this.maxBrightness;
        return {x:x,y:y,bri: brightness};
    }

    rgbToHex(r,g,b){
        let rString = Math.round(r).toString(16);
        let gString = Math.round(g).toString(16);
        let bString = Math.round(b).toString(16);

        if (rString.length < 2)
            rString="0"+rString;
        if (gString.length < 2)
            gString="0"+gString;
        if (bString.length < 2)
            bString="0"+bString;

        return "#"+rString + gString + bString;
    }

    /**
     *
     * @param r {Number} red value, 0 - 255
     * @param g {Number} green value, 0 - 255
     * @param b {Number} blue value, 0 - 255
     * @param maxBrightness {Number}
     * @returns {{h, s, v : number}} h 0-360, s: 0-100, v: 0 - 100
     */
    rgbToHSV ({r=0,g=0,b=0}={}, maxBrightness=this.maxBrightness) {
        let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
        rabs = r / 255;
        gabs = g / 255;
        babs = b / 255;
        v = Math.max(rabs, gabs, babs),
            diff = v - Math.min(rabs, gabs, babs);
        diffc = c => (v - c) / 6 / diff + 1 / 2;
        percentRoundFn = (num) => Math.round(num * 100) / 100;
        if (diff == 0) {
            h = s = 0;
        } else {
            s = diff / v;
            rr = diffc(rabs);
            gg = diffc(gabs);
            bb = diffc(babs);

            if (rabs === v) {
                h = bb - gg;
            } else if (gabs === v) {
                h = (1 / 3) + rr - bb;
            } else if (babs === v) {
                h = (2 / 3) + gg - rr;
            }
            if (h < 0) {
                h += 1;
            }else if (h > 1) {
                h -= 1;
            }
        }
        return {
            h: Math.round(h * 360),
            s: percentRoundFn(s * 100),
            v: percentRoundFn(v * 100)
        };
    }

    /**
     *
     * @param r {Number} red value, 0 - 255
     * @param g {Number} green value, 0 - 255
     * @param b {Number} blue value, 0 - 255
     * @param maxBrightness {Number}
     * @returns {{h, s, v : number}} h: 0 - 360, s: 0-255, v: 0-maxBrightness
     */
    rgbToHSV2({r,g,b, maxBrightness = this.maxBrightness}) {
        r  = r/255
        g  = g/255
        b  = b/255

        let v=Math.max(r,g,b);
        let c=v-Math.min(r,g,b);
        let h= c && ((v==r) ? (g-b)/c : ((v==g) ? 2+(b-r)/c : 4+(r-g)/c));
        const res_s = this.normalize({max: 255, value: (v&&c/v)})
        const res_v = this.normalize({max: maxBrightness, value: v});
        return {
            h: 60*(h<0?h+6:h),
            s: res_s,
            v: res_v
        };
    }

    /**
     *
     * @param h {Number} hue value, 0 - 360
     * @param s {Number} saturation value, 0 - 255
     * @param v {Number} Brighntess value, 0 - maxBrightness
     * @returns {{r: number, b: number, g: number}}
     */
    hsvToRGB ({h=0, s=0, v=this.maxBrightness}={}) {
        var r, g, b, i, f, p, q, t;
        h = h === 0 ? 0 : h / 360;
        v = v === 0 ? 0 : v / this.maxBrightness;
        s = s === 0 ? 0 : s/ 255

        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    hsvToXYBri ({h=0, s=0, v=this.maxBrightness}={}){
        return this.rgbToXYBri(this.hsvToRGB({h,s,v}));
    }

    /**
     *
     * @param min {number}
     * @param max {number}
     * @param value {number} percent value
     * @returns {Integer}
     */
    normalize({min=0, max=255, value}){
        if(value < 0) return min;
        if(value > 1) return max;
        const span = max - min;
        let res = Math.round(span * value) + min;
        if(res < min) res = min;
        if(value > max) res = max;
        return res;
    }
}