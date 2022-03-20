// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

!function(t, r) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = r() : "function" == typeof define && define.amd ? define(r) : (t = "undefined" != typeof globalThis ? globalThis : t || self).FastAverageColor = r();
}(this, function() {
    "use strict";
    function t1(t) {
        var r = t.toString(16);
        return 1 === r.length ? "0" + r : r;
    }
    function r1(r) {
        return "#" + r.map(t1).join("");
    }
    function e1(t) {
        return t ? (r = t, Array.isArray(r[0]) ? t : [
            t
        ]) : [];
        var r;
    }
    function n1(t, r, e) {
        for(var n = 0; n < e.length; n++)if (o1(t, r, e[n])) return !0;
        return !1;
    }
    function o1(t2, r2, e2) {
        switch(e2.length){
            case 3:
                if ((function(t, r, e) {
                    if (255 !== t[r + 3]) return !0;
                    if (t[r] === e[0] && t[r + 1] === e[1] && t[r + 2] === e[2]) return !0;
                    return !1;
                })(t2, r2, e2)) return !0;
                break;
            case 4:
                if ((function(t, r, e) {
                    if (t[r + 3] && e[3]) return t[r] === e[0] && t[r + 1] === e[1] && t[r + 2] === e[2] && t[r + 3] === e[3];
                    return t[r + 3] === e[3];
                })(t2, r2, e2)) return !0;
                break;
            case 5:
                if ((function(t, r, e) {
                    var n = e[0], o = e[1], a = e[2], s = e[3], u = e[4], c = t[r + 3], h = i1(c, s, u);
                    if (!s) return h;
                    if (!c && h) return !0;
                    if (i1(t[r], n, u) && i1(t[r + 1], o, u) && i1(t[r + 2], a, u) && h) return !0;
                    return !1;
                })(t2, r2, e2)) return !0;
                break;
            default:
                return !1;
        }
    }
    function i1(t, r, e) {
        return t >= r - e && t <= r + e;
    }
    function a1(t, r, e) {
        for(var o = {}, i = e.ignoredColor, a = e.step, s = [
            0,
            0,
            0,
            0,
            0
        ], u = 0; u < r; u += a){
            var c = t[u], h = t[u + 1], d = t[u + 2], l = t[u + 3];
            if (!i || !n1(t, u, i)) {
                var f = Math.round(c / 24) + "," + Math.round(h / 24) + "," + Math.round(d / 24);
                o[f] ? o[f] = [
                    o[f][0] + c * l,
                    o[f][1] + h * l,
                    o[f][2] + d * l,
                    o[f][3] + l,
                    o[f][4] + 1
                ] : o[f] = [
                    c * l,
                    h * l,
                    d * l,
                    l,
                    1
                ], s[4] < o[f][4] && (s = o[f]);
            }
        }
        var g = s[0], v = s[1], p = s[2], m = s[3], C = s[4];
        return m ? [
            Math.round(g / m),
            Math.round(v / m),
            Math.round(p / m),
            Math.round(m / C)
        ] : e.defaultColor;
    }
    function s1(t, r, e) {
        for(var o = 0, i = 0, a = 0, s = 0, u = 0, c = e.ignoredColor, h = e.step, d = 0; d < r; d += h){
            var l = t[d + 3], f = t[d] * l, g = t[d + 1] * l, v = t[d + 2] * l;
            c && n1(t, d, c) || (o += f, i += g, a += v, s += l, u++);
        }
        return s ? [
            Math.round(o / s),
            Math.round(i / s),
            Math.round(a / s),
            Math.round(s / u)
        ] : e.defaultColor;
    }
    function u1(t, r, e) {
        for(var o = 0, i = 0, a = 0, s = 0, u = 0, c = e.ignoredColor, h = e.step, d = 0; d < r; d += h){
            var l = t[d], f = t[d + 1], g = t[d + 2], v = t[d + 3];
            c && n1(t, d, c) || (o += l * l * v, i += f * f * v, a += g * g * v, s += v, u++);
        }
        return s ? [
            Math.round(Math.sqrt(o / s)),
            Math.round(Math.sqrt(i / s)),
            Math.round(Math.sqrt(a / s)),
            Math.round(s / u)
        ] : e.defaultColor;
    }
    function c1(t) {
        return h1(t, "defaultColor", [
            0,
            0,
            0,
            0
        ]);
    }
    function h1(t, r, e) {
        return void 0 === t[r] ? e : t[r];
    }
    function d1(t) {
        return t instanceof HTMLCanvasElement ? "canvas" : t.src;
    }
    var l1 = "FastAverageColor: ";
    function f1(t, r, e) {
        r || (console.error(l1 + t), e && console.error(e));
    }
    function g1(t) {
        return Error(l1 + t);
    }
    return (function() {
        function t3() {
            this.canvas = null, this.ctx = null;
        }
        return t3.prototype.getColorAsync = function(t, r) {
            var e;
            if (!t) return Promise.reject(g1("call .getColorAsync() without resource."));
            if ("string" == typeof t) {
                var n = new Image;
                return n.crossOrigin = null !== (e = null == r ? void 0 : r.crossOrigin) && void 0 !== e ? e : "", n.src = t, this.bindImageEvents(n, r);
            }
            if (t instanceof Image && !t.complete) return this.bindImageEvents(t, r);
            var o = this.getColor(t, r);
            return o.error ? Promise.reject(o.error) : Promise.resolve(o);
        }, t3.prototype.getColor = function(t4, r3) {
            var e3 = c1(r3 = r3 || {});
            if (!t4) return f1("call .getColor(null) without resource.", r3.silent), this.prepareResult(e3);
            var n2 = function(t) {
                if (t instanceof HTMLImageElement) {
                    var r = t.naturalWidth, e = t.naturalHeight;
                    return t.naturalWidth || -1 === t.src.search(/\.svg(\?|$)/i) || (r = e = 100), {
                        width: r,
                        height: e
                    };
                }
                return t instanceof HTMLVideoElement ? {
                    width: t.videoWidth,
                    height: t.videoHeight
                } : {
                    width: t.width,
                    height: t.height
                };
            }(t4), o2 = function(t, r) {
                var e, n = h1(r, "left", 0), o = h1(r, "top", 0), i = h1(r, "width", t.width), a = h1(r, "height", t.height), s = i, u = a;
                return "precision" === r.mode || (i > a ? (e = i / a, s = 100, u = Math.round(s / e)) : (e = a / i, u = 100, s = Math.round(u / e)), (s > i || u > a || s < 10 || u < 10) && (s = i, u = a)), {
                    srcLeft: n,
                    srcTop: o,
                    srcWidth: i,
                    srcHeight: a,
                    destWidth: s,
                    destHeight: u
                };
            }(n2, r3);
            if (!(o2.srcWidth && o2.srcHeight && o2.destWidth && o2.destHeight)) return f1('incorrect sizes for resource "'.concat(d1(t4), '".'), r3.silent), this.prepareResult(e3);
            if (this.canvas || (this.canvas = "undefined" == typeof window ? new OffscreenCanvas(1, 1) : document.createElement("canvas")), !this.ctx && (this.ctx = this.canvas.getContext && this.canvas.getContext("2d"), !this.ctx)) return f1("Canvas Context 2D is not supported in this browser.", r3.silent), this.prepareResult(e3);
            this.canvas.width = o2.destWidth, this.canvas.height = o2.destHeight;
            var i2 = e3;
            try {
                this.ctx.clearRect(0, 0, o2.destWidth, o2.destHeight), this.ctx.drawImage(t4, o2.srcLeft, o2.srcTop, o2.srcWidth, o2.srcHeight, 0, 0, o2.destWidth, o2.destHeight);
                var a2 = this.ctx.getImageData(0, 0, o2.destWidth, o2.destHeight).data;
                i2 = this.getColorFromArray4(a2, r3);
            } catch (e) {
                f1("security error (CORS) for resource ".concat(d1(t4), ".\nDetails: https://developer.mozilla.org/en/docs/Web/HTML/CORS_enabled_image"), r3.silent, e);
            }
            return this.prepareResult(i2);
        }, t3.prototype.getColorFromArray4 = function(t, r) {
            r = r || {};
            var n = t.length, o = c1(r);
            if (n < 4) return o;
            var i, h = n - n % 4, d = 4 * (r.step || 1);
            switch(r.algorithm || "sqrt"){
                case "simple":
                    i = s1;
                    break;
                case "sqrt":
                    i = u1;
                    break;
                case "dominant":
                    i = a1;
                    break;
                default:
                    throw g1("".concat(r.algorithm, " is unknown algorithm."));
            }
            return i(t, h, {
                defaultColor: o,
                ignoredColor: e1(r.ignoredColor),
                step: d
            });
        }, t3.prototype.prepareResult = function(t) {
            var e, n = t.slice(0, 3), o = [
                t[0],
                t[1],
                t[2],
                t[3] / 255
            ], i = (299 * (e = t)[0] + 587 * e[1] + 114 * e[2]) / 1000 < 128;
            return {
                value: [
                    t[0],
                    t[1],
                    t[2],
                    t[3]
                ],
                rgb: "rgb(" + n.join(",") + ")",
                rgba: "rgba(" + o.join(",") + ")",
                hex: r1(n),
                hexa: r1(t),
                isDark: i,
                isLight: !i
            };
        }, t3.prototype.destroy = function() {
            this.canvas = null, this.ctx = null;
        }, t3.prototype.bindImageEvents = function(t, r) {
            var e = this;
            return new Promise(function(n, o) {
                var i3 = function() {
                    u();
                    var i = e.getColor(t, r);
                    i.error ? o(i.error) : n(i);
                }, a = function() {
                    u(), o(g1('Error loading image "'.concat(t.src, '".')));
                }, s = function() {
                    u(), o(g1('Image "'.concat(t.src, '" loading aborted.')));
                }, u = function() {
                    t.removeEventListener("load", i3), t.removeEventListener("error", a), t.removeEventListener("abort", s);
                };
                t.addEventListener("load", i3), t.addEventListener("error", a), t.addEventListener("abort", s);
            });
        }, t3;
    })();
});

