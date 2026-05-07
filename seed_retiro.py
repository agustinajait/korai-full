import hashlib
import json
import random
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

SUPABASE_URL = "https://jgqqkgfppovkbwklctol.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncXFrZ2ZwcG92a2J3a2xjdG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQ2MDAsImV4cCI6MjA4NTM0MDYwMH0.q95WEPClPWxpjKE53dLcewiaGC_FF2A17zvphJgYvq4"
CAMPAIGN_ID = "53813f5a-3613-4faf-8ca1-b369e4e908cb"
TENANT_ID = "bb625c2d-6f37-4576-9956-6eba33ef665e"
INSTRUMENT_ID = "ee6f36aa4f0e75e6203bc5d854f04b5305d2ab28e9e17817fbb58f4c02eb8e5c"

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

INDICADORES_T = ["empleo_01","empleo_02","empleo_03","empleo_04"]
INDICADORES_N = ["empleo_05","empleo_06","empleo_07","empleo_08"]
INDICADORES_OTROS = [
    "prevision_01","prevision_02","prevision_03","prevision_04","prevision_05","prevision_06",
    "vivienda_01","vivienda_02","vivienda_03","vivienda_04","vivienda_05","vivienda_06","vivienda_07","vivienda_08",
    "salud_01","salud_02","salud_03","salud_04","salud_05","salud_06","salud_07","salud_08",
    "educacion_01","educacion_02","educacion_03","educacion_04","educacion_05","educacion_06","educacion_07","educacion_08",
    "red_01","red_02","red_03","red_04","red_05","red_06",
]

def gen_answers(perfil, tiene_trabajo=True):
    weights = {"critico":[0.1,0.2,0.7],"moderado":[0.3,0.4,0.3],"estable":[0.6,0.3,0.1]}[perfil]
    answers = {}
    for ind in (INDICADORES_T if tiene_trabajo else INDICADORES_N) + INDICADORES_OTROS:
        answers[ind] = random.choices(["verde","amarillo","rojo"], weights=weights)[0]
    return answers

def evolucionar(answers, direccion):
    a = dict(answers)
    colores = ["verde","amarillo","rojo"]
    keys = random.sample(list(a.keys()), k=max(1, len(a)//3))
    for k in keys:
        idx = colores.index(a[k])
        if direccion == "mejora" and idx > 0:
            a[k] = colores[idx-1]
        elif direccion == "empeora" and idx < 2:
            a[k] = colores[idx+1]
    return a

def hash_dni(dni):
    return hashlib.sha256(dni.strip().encode()).hexdigest()

def insert_response(payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/responses",
        data=data,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        print(f"  ERROR {e.code}: {e.read().decode()}")
        return e.code

now = datetime.now(timezone.utc)
date_60 = now - timedelta(days=60)
date_30 = now - timedelta(days=30)

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
total_ok = 0

for i, (nombre, apellido) in enumerate(NOMBRES):
    perfil_ini, direccion, tiene_trabajo = EVOLUCIONES[i]
    dni = str(20000000 + i * 1337 + i * 7)
    dni_hash = hash_dni(dni)
    sit_lab = "tengo_trabajo" if tiene_trabajo else "no_tengo_trabajo"

    answers_60 = gen_answers(perfil_ini, tiene_trabajo)
    answers_30 = evolucionar(answers_60, direccion)
    acepto = i % 3 != 0  # ~67% aceptaron seguimiento

    perfil_ctx = json.dumps({
        "nombre": nombre, "apellido": apellido, "comentario": "",
        "profundizacion": {"situacion_laboral": sit_lab}
    })
    territorio = {"ciudad": "Buenos Aires", "barrio": "Retiro"}

    for answers, date, dtype, days in [
        (answers_60, date_60, "baseline", 0),
        (answers_30, date_30, "follow_up_valid", 30),
    ]:
        payload = {
            "tenant_id": TENANT_ID, "campaign_id": CAMPAIGN_ID,
            "instrument_id": INSTRUMENT_ID, "dni_hash": dni_hash, "dni_real": dni,
            "answers": answers, "territorio": territorio,
            "perfil_contextual": perfil_ctx,
            "submitted_at": date.isoformat(), "diagnostic_type": dtype,
            "days_since_last": days, "prev_response_id": None,
            "acepto_seguimiento": acepto, "fecha_aceptacion": None,
            "perfil_contextual": perfil_ctx,
        }
        insert_response(payload)

    evol = "📈" if direccion=="mejora" else "📉" if direccion=="empeora" else "➡️"
    print(f"✅ {evol} {nombre} {apellido} ({perfil_ini} → {direccion})")
    total_ok += 1

print(f"\n✅ {total_ok} personas cargadas — {total_ok*2} diagnósticos en Retiro")
