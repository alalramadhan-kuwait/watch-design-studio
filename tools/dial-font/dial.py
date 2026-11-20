"""General dial tools: fit a dial seen at an angle, straighten it, find its figures.

    fit(img, dial_mask)          -> ellipse (cx, cy, a, b, theta) of the dial's face
    rectify(img, ell, rot, N)    -> the face as a true circle, N x N, 12 at the top (rot degrees turns it)
    figures(face, dark)          -> the figure shapes on the rectified face: (label, angle, radius, bbox)

The face is assumed flat: a dial seen a little off axis is an ellipse, and an
affine map takes it back to a circle (the error of ignoring perspective is a
fraction of a percent at the tilts in product and wrist photographs).
"""
import numpy as np
from PIL import Image
from scipy import ndimage

def fit(mask):
    """the ellipse of a filled region, from its second moments: centre, semi-axes, angle of the major axis (rad)"""
    ys, xs = np.nonzero(mask)
    cx, cy = xs.mean(), ys.mean()
    cov = np.cov(np.vstack([xs - cx, ys - cy]))
    ev, vec = np.linalg.eigh(cov)
    a, b = 2 * np.sqrt(ev[1]), 2 * np.sqrt(ev[0])          # a filled ellipse: variance = semi-axis^2 / 4
    th = np.arctan2(vec[1, 1], vec[0, 1])
    return cx, cy, a, b, th

def rectify(img, ell, rot=0.0, N=2400, margin=1.0):
    """sample the face onto a circle of radius N/2 (times margin): u right, v down, 12 at the top after `rot`"""
    cx, cy, a, b, th = ell
    arr = np.asarray(img).astype(float)
    s = np.linspace(-margin, margin, N)
    U, V = np.meshgrid(s, s)
    r = np.radians(rot); Ur = U * np.cos(r) - V * np.sin(r); Vr = U * np.sin(r) + V * np.cos(r)
    # the unit circle onto the ellipse: along the major axis a, the minor b
    X = cx + Ur * a * np.cos(th) - Vr * b * np.sin(th)
    Y = cy + Ur * a * np.sin(th) + Vr * b * np.cos(th)
    chans = [ndimage.map_coordinates(arr[..., c], [Y, X], order=3, mode='nearest') for c in range(arr.shape[2])] if arr.ndim == 3 else [ndimage.map_coordinates(arr, [Y, X], order=3)]
    out = np.clip(np.stack(chans, -1), 0, 255).astype('uint8')
    return Image.fromarray(out.squeeze())

def face_edge(face, c0, rmin, rmax, n=720, gap=40):
    """points where a face mask ends, cast out from c0: on each ray the first run of `gap`
    pixels off the face beyond rmin (ticks and figures are shorter than that)"""
    pts = []
    H, W = face.shape
    for t in np.linspace(0, 2 * np.pi, n, endpoint=False):
        dx, dy = np.cos(t), np.sin(t); off = 0; last = None
        for r in range(int(rmin), int(rmax)):
            x, y = int(c0[0] + r * dx), int(c0[1] + r * dy)
            if not (0 <= x < W and 0 <= y < H): break
            if face[y, x]: last = r; off = 0
            else:
                off += 1
                if off >= gap and last is not None: break
        if last is not None: pts.append((c0[0] + last * dx, c0[1] + last * dy))
    return np.array(pts)

def fit_conic(pts):
    """least-squares ellipse through points (direct fit, then axes): cx, cy, a, b, theta"""
    x, y = pts[:, 0], pts[:, 1]
    mx, my = x.mean(), y.mean(); sx = x.std(); x = (x - mx) / sx; y = (y - my) / sx
    D = np.c_[x * x, x * y, y * y, x, y, np.ones_like(x)]
    S = D.T @ D; C = np.zeros((6, 6)); C[0, 2] = C[2, 0] = 2; C[1, 1] = -1
    ev, evec = np.linalg.eig(np.linalg.solve(S, C))
    k = np.argmax(np.real(ev) > 0) if (np.real(ev) > 0).any() else 0
    A, B, Cc, Dd, E, F = np.real(evec[:, k])
    # centre and axes
    M = np.array([[A, B / 2], [B / 2, Cc]]); c = np.linalg.solve(2 * M, [-Dd, -E])
    Fc = F + Dd * c[0] / 2 + E * c[1] / 2
    ev2, vec2 = np.linalg.eigh(M)
    ax = np.sqrt(-Fc / ev2)
    i = np.argmax(ax); a, b = ax[i], ax[1 - i]; th = np.arctan2(vec2[1, i], vec2[0, i])
    return c[0] * sx + mx, c[1] * sx + my, a * sx, b * sx, th

def resid(pts, ell):
    cx, cy, a, b, th = ell
    x, y = pts[:, 0] - cx, pts[:, 1] - cy
    u = x * np.cos(th) + y * np.sin(th); v = -x * np.sin(th) + y * np.cos(th)
    return np.sqrt((u / a) ** 2 + (v / b) ** 2) - 1

def snap_dark(arr_L, guess, win=70, thr=None):
    """the centre of the dark marks (printed digits) within `win` px of a guess"""
    x, y = int(guess[0]), int(guess[1])
    w = arr_L[y - win:y + win, x - win:x + win]
    t = thr if thr is not None else (np.percentile(w, 50) - 45)
    ys, xs = np.nonzero(w < t)
    if len(xs) < 10: return None
    return (x - win + xs.mean(), y - win + ys.mean())

def fit_affine(img_pts, angles_deg):
    """image = c + M [sin a, -cos a]: the dial's unit circle (12 at the top) onto the photograph"""
    a = np.radians(np.asarray(angles_deg)); P = np.c_[np.sin(a), -np.cos(a), np.ones_like(a)]
    sol, *_ = np.linalg.lstsq(P, np.asarray(img_pts), rcond=None)    # rows: M[:,0], M[:,1], c
    M = sol[:2].T; c = sol[2]
    pred = P @ sol; err = np.hypot(*(pred - np.asarray(img_pts)).T)
    return M, c, err

def rectify_affine(img, M, c, N=2400, extent=1.15):
    """the dial as a true circle, N x N, 12 at the top; extent in units of the fitted circle"""
    arr = np.asarray(img).astype(float)
    s = np.linspace(-extent, extent, N); U, V = np.meshgrid(s, s)
    X = c[0] + M[0, 0] * U + M[0, 1] * V; Y = c[1] + M[1, 0] * U + M[1, 1] * V
    chans = [ndimage.map_coordinates(arr[..., k], [Y, X], order=3, mode='nearest') for k in range(arr.shape[2])]
    return Image.fromarray(np.clip(np.stack(chans, -1), 0, 255).astype('uint8'))
