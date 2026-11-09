"""Build app/norel-case-r1.glb from Blue Creations' STEP of the B6098G-A1 case.

    python3 tools/norel-case-glb.py <B6098G-A1-SW240_case_assembly_R1.stp> app/norel-case-r1.glb

Only the R1 parts the 3D view uses as they are drawn: the case middle with its
lugs, the crown and the case back. The bezel, crystal and cyclops changed at R4
(3 Nov drawing) and are built procedurally in src/relief3d.js to those numbers,
so they are left out here; so is the crown tube, which the crown hides.

Frame: millimetres, +X toward 3 o'clock (the crown), +Y toward 12, +Z toward
the viewer, origin at the dial centre on the dial top. In the STEP the case
top is z 0 and the dial top sits 0.80 below it (dial Ø33.50 x 0.40 on its
holder), so every part is lifted by 0.80.

The CAD faces are tessellated with the surface normals OpenCascade computes
from the exact geometry, one vertex set per face, so curved faces shade
smoothly and the edges between faces stay crisp; the tessellation tolerance is
the decimation. Positions are stored as normalised int16 and normals as int8
(KHR_mesh_quantization), which three's GLTFLoader reads directly.
Needs CadQuery's OCP (python3 -c "import OCP").
"""
import sys, json, struct
import numpy as np
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TDocStd import TDocStd_Document
from OCP.TCollection import TCollection_ExtendedString
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.TDF import TDF_LabelSequence
from OCP.TDataStd import TDataStd_Name
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.BRepLib import BRepLib_ToolTriangulatedShape
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE, TopAbs_REVERSED
from OCP.BRep import BRep_Tool
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS
from OCP.IFSelect import IFSelect_RetDone

DIAL_TOP = -0.80          # STEP z of the dial top
# STEP part name -> (glb name, linear deflection mm, angular deflection rad)
PARTS = {"_壳": ("case", 0.008, 0.09), "巴的": ("crown", 0.01, 0.16), "底盖": ("caseback", 0.03, 0.2)}

def part_labels(path):
    doc = TDocStd_Document(TCollection_ExtendedString("doc"))
    r = STEPCAFControl_Reader(); r.SetNameMode(True)
    if r.ReadFile(path) != IFSelect_RetDone: raise SystemExit("cannot read " + path)
    r.Transfer(doc)
    st = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
    free = TDF_LabelSequence(); st.GetFreeShapes(free)
    comps = TDF_LabelSequence(); st.GetComponents_s(free.Value(1), comps)
    for i in range(1, comps.Length() + 1):
        lab = comps.Value(i); n = TDataStd_Name()
        name = n.Get().ToExtString() if lab.FindAttribute(TDataStd_Name.GetID_s(), n) else "?"
        yield name.split(".")[0], st.GetShape_s(lab), doc

def tessellate(shape, lin, ang):
    BRepMesh_IncrementalMesh(shape, lin, False, ang, True)
    P, N, I = [], [], []
    e = TopExp_Explorer(shape, TopAbs_FACE)
    while e.More():
        f = TopoDS.Face_s(e.Current()); loc = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(f, loc)
        if tri is not None:
            BRepLib_ToolTriangulatedShape.ComputeNormals_s(f, tri)
            tr = loc.Transformation(); rev = f.Orientation() == TopAbs_REVERSED; base = len(P)
            for k in range(1, tri.NbNodes() + 1):
                p = tri.Node(k).Transformed(tr); n = tri.Normal(k).Transformed(tr)
                P.append((p.X(), p.Y(), p.Z() - DIAL_TOP))
                s = -1 if rev else 1
                N.append((n.X()*s, n.Y()*s, n.Z()*s))
            for k in range(1, tri.NbTriangles() + 1):
                a, b, c = tri.Triangle(k).Get()
                I.append((base + a - 1, base + c - 1, base + b - 1) if rev else (base + a - 1, base + b - 1, base + c - 1))
        e.Next()
    P = np.array(P, np.float64); N = np.array(N, np.float64); I = np.array(I, np.uint32)
    N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
    # a normal OpenCascade got backwards still has to face away from the solid:
    # check it against the face winding and flip the vertex if they disagree
    fn = np.cross(P[I[:, 1]] - P[I[:, 0]], P[I[:, 2]] - P[I[:, 0]])
    acc = np.zeros_like(P)
    for j in range(3): np.add.at(acc, I[:, j], fn)
    flip = (acc*N).sum(1) < 0
    N[flip] *= -1
    return P, N, I

def build(step, out):
    meshes = []
    for name, shape, _doc in part_labels(step):
        if name not in PARTS: continue
        glb_name, lin, ang = PARTS[name]
        P, N, I = tessellate(shape, lin, ang)
        meshes.append((glb_name, P, N, I))
        print(f"{glb_name:9s} {len(P):6d} vertices {len(I):6d} triangles")
    order = {"case": 0, "crown": 1, "caseback": 2}
    meshes.sort(key=lambda m: order[m[0]])
    blob = bytearray(); views = []; accessors = []; gl_meshes = []; nodes = []
    def view(data, target, stride=None):
        while len(blob) % 4: blob.append(0)
        v = {"buffer": 0, "byteOffset": len(blob), "byteLength": len(data), "target": target}
        if stride: v["byteStride"] = stride
        blob.extend(data); views.append(v); return len(views) - 1
    for name, P, N, I in meshes:
        lo, hi = P.min(0), P.max(0); ctr = (lo + hi)/2; half = np.max(hi - lo)/2
        q = np.round((P - ctr)/half*32767).astype(np.int16)
        vbuf = np.zeros((len(P), 4), np.int16); vbuf[:, :3] = q
        nbuf = np.zeros((len(P), 4), np.int8); nbuf[:, :3] = np.round(N*127).astype(np.int8)
        pv = view(vbuf.tobytes(), 34962, 8); nv = view(nbuf.tobytes(), 34962, 4)
        big = len(P) > 65535
        iv = view(I.astype(np.uint32 if big else np.uint16).tobytes(), 34963)
        qlo = (q.min(0)).tolist(); qhi = (q.max(0)).tolist()
        accessors += [
            {"bufferView": pv, "componentType": 5122, "normalized": True, "count": len(P), "type": "VEC3",
             "min": [v/32767 for v in qlo], "max": [v/32767 for v in qhi]},
            {"bufferView": nv, "componentType": 5120, "normalized": True, "count": len(P), "type": "VEC3"},
            {"bufferView": iv, "componentType": 5125 if big else 5123, "count": int(I.size), "type": "SCALAR"}]
        a = len(accessors) - 3
        gl_meshes.append({"name": name, "primitives": [{"attributes": {"POSITION": a, "NORMAL": a + 1}, "indices": a + 2}]})
        nodes.append({"name": name, "mesh": len(gl_meshes) - 1, "translation": ctr.tolist(), "scale": [half]*3})
    gltf = {"asset": {"version": "2.0", "generator": "tools/norel-case-glb.py",
                      "copyright": "Case geometry: Blue Creations B6098G-A1-SW240 assembly R1 (STEP)"},
            "extensionsUsed": ["KHR_mesh_quantization"], "extensionsRequired": ["KHR_mesh_quantization"],
            "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": gl_meshes,
            "accessors": accessors, "bufferViews": views, "buffers": [{"byteLength": len(blob)}]}
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" "*((4 - len(js) % 4) % 4)
    while len(blob) % 4: blob.append(0)
    with open(out, "wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)))
        f.write(struct.pack("<II", len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack("<II", len(blob), 0x004E4942)); f.write(blob)
    print(out, 12 + 16 + len(js) + len(blob), "bytes")

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
