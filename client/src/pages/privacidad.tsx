export default function Privacidad() {
    return (
      <div className="min-h-screen bg-[#F4F0FF] px-5 py-10 max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-[#1E1040] mb-2">Política de Privacidad</h1>
        <p className="text-sm text-[#6B5FA0] mb-8">Última actualización: Mayo 2026</p>
  
        {[
          { titulo: "1. Introducción", texto: "KORAI es una aplicación de diagnóstico de bienestar comunitario. Esta política describe cómo recopilamos, usamos y protegemos tu información personal." },
          { titulo: "2. Información que recopilamos", texto: "DNI (encriptado), número de WhatsApp (opcional), nombre, barrio, edad, situación laboral, vivienda, personas a cargo y respuestas al diagnóstico de bienestar." },
          { titulo: "3. Cómo usamos tu información", texto: "Para generar tu plan personalizado, enviarte recursos disponibles en tu zona, hacer seguimiento de tu situación y mejorar los servicios comunitarios de tu municipio." },
          { titulo: "4. Cómo protegemos tu información", texto: "Tu DNI nunca se almacena en texto plano — solo guardamos un hash criptográfico. Todos los datos se transmiten por HTTPS y se almacenan en servidores seguros. No vendemos ni compartimos tu información con terceros." },
          { titulo: "5. Tus derechos", texto: "Tenés derecho a acceder, corregir o eliminar tu información en cualquier momento. Contactanos en korai@huehaci.org" },
          { titulo: "6. WhatsApp", texto: "Si elegís recibir tu plan por WhatsApp, usamos la API de WhatsApp Business de Meta. Podés darte de baja respondiendo STOP." },
          { titulo: "7. Contacto", texto: "Email: korai@huehaci.org — Sitio web: https://app.korai.lat" },
        ].map((s) => (
          <div key={s.titulo} className="mb-6">
            <h2 className="text-lg font-black text-[#5B21B6] mb-2">{s.titulo}</h2>
            <p className="text-sm text-[#1E1040] leading-relaxed">{s.texto}</p>
          </div>
        ))}
      </div>
    );
  }