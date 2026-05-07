import hashlib, json, random, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4"
CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb"
TENANT_ID = "bb625c2d-6f37-4576-9956-6eba33ef665e"

NOMBRES = [
    ("Lucía","Romero"),("Martín","González"),("Valentina","López"),
    ("Diego","Fernández"),("Camila","Martínez"),("Sebastián","Pérez"),
    ("Florencia","García"),("Nicolás","Rodríguez"),("Agustina","Sánchez"),
    ("Ezequiel","Torres"),("Sofía","Ruiz"),("Matías","Díaz"),
    ("Julieta","Moreno"),("Facundo","Álvarez"),("Micaela","Jiménez"),
    ("Leandro","Herrera"),("Natalia","Medina"),("Rodrigo","Castro"),
    ("Daniela","Vargas"),("Tomás","Ramos"),("Carla","Flores"),
    ("Ignacio","Cruz"),("Paula","Ortega"),("Andrés","Reyes"),
    ("Verónica","Núñez")
]

INDS_T = ["empleo_01","empleo_02","empleo_03","empleo_04"]
INDS_N = ["empleo_05","empleo_06","empleo_07","empleo_08"]
INDS_O = [
    "prevision_01","prevision_02","prevision_03","prevision_04","prevision_05","prevision_06",
    "vivienda_01","vivienda_02","vivienda_03","vivienda_04","vivienda_05","vivienda_06","vivienda_07","vivienda_08",
    "salud_01","salud_02","salud_03","salud_04","salud_05","salud_06","salud_07","salud_08",
    "educacion_01","educacion_02","educacion_03","educacion_04","educacion_05","educacion_06","educacion_07","educacion_08",
    "red_01","red_02","red_03","red_04","red_05","red_06",
]

def gen_answers(perfil, tiene_trabajo):
    w = {"critico":[0.1,0.2,0.7],"moderado":[0.3,0.4,0.3],"estable":[0.6,0.3,0.1]}[perfil]
    a = {}
    for ind in (INDS_T if tiene_trabajo else INDS_N) + INDS_O:
        a[ind] = random.choices(["verde","amarillo","rojo"], weights=w)[0]
    return a

def evolucionar(a, dir):
    r = dict(a)
    c = ["verde","amarillo","rojo"]
    for k in random.sample(list(r.keys()), k=max(1,len(r)//3)):
        i = c.index(r[k])
        if dir=="mejora" and i>0: r[k]=c[i-1]
        elif dir=="empeora" and i<2: r[k]=c[i+1]
    return r

def req(method, path, body=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body else None
    rq = urllib.request.Request(url, data=data, headers={
        "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json", "Prefer": "return=minimal"
    }, method=method)
    try:
        with urllib.request.urlopen(rq) as r: return r.status
    except urllib.error.HTTPError as e:
        print(f"  ERR {e.code}: {e.read().decode()[:100]}")
        return e.code

# 1. Eliminar los casos de Retiro mal cargados
print("Eliminando casos anteriores de Retiro...")
dni_bases = [str(20000000 + i*1337 + i*7) for i in range(25)]
for dni in dni_bases:
    h = hashlib.sha256(dni.encode()).hexdigest()
    req("DELETE", f"responses?campaign_id=eq.{CAMPAIGN_ID}&dni_hash=eq.{h}")
print("Listo. Cargando nuevos...")

EVOLUCIONES = [
    ("critico","mejora",False),("critico","mejora",False),("critico","estable",False),
    ("critico","empeora",False),("critico","mejora",True),("moderado","mejora",True),
    ("moderado","mejora",False),("moderado","empeora",True),("moderado","estable",False),
    ("moderado","mejora",True),("moderado","empeora",False),("moderado","estable",True),
    ("estable","estable",True),("estable","empeora",True),("estable","mejora",True),
    ("critico","mejora",False),("moderado","mejora",True),("critico","empeora",False),
    ("moderado","estable",False),("estable","estable",True),("critico","mejora",True),
    ("moderado","empeora",False),("estable","empeora",True),("moderado","mejora",False),
    ("critico","estable",False),
]

random.seed(42)
now = datetime.now(timezone.utc)

for i,(nombre,apellido) in enumerate(NOMBRES):
    perfil,dir,tt = EVOLUCIONES[i]
    dni = str(20000000 + i*1337 + i*7)
    dni_hash = hashlib.sha256(dni.encode()).hexdigest()
    sit = "tengo_trabajo" if tt else "no_tengo_trabajo"

    a60 = gen_answers(perfil, tt)
    a30 = evolucionar(a60, dir)

    # perfil_contextual correcto — solo UNA vez, sin duplicar
    ctx = {
        "nombre": nombre,
        "apellido": apellido,
        "comentario": "",
        "profundizacion": {"situacion_laboral": sit}
    }

    for answers, date, days in [
        (a60, now-timedelta(days=60), 0),
        (a30, now-timedelta(days=30), 30),
    ]:
        payload = {
            "tenant_id": TENANT_ID,
            "campaign_id": CAMPAIGN_ID,
            "dni_hash": dni_hash,
            "dni_real": dni,
            "answers": answers,
            "territorio": {"ciudad": "Buenos Aires", "barrio": "Retiro"},
            "perfil_contextual": json.dumps(ctx),
            "submitted_at": date.isoformat(),
            "acepto_seguimiento": i % 3 != 0,
        }
        req("POST", "responses", payload)

    ev = "📈" if dir=="mejora" else "📉" if dir=="empeora" else "➡️"
    print(f"✅ {ev} {nombre} {apellido} ({perfil}→{dir})")

print(f"\n✅ 25 personas / 50 diagnósticos cargados en Retiro")
