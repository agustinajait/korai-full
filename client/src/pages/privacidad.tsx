export default function Privacidad() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F0FF", color: "#1E1040", padding: "40px 20px", maxWidth: "700px", margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#1E1040", marginBottom: "8px" }}>Politica de Privacidad</h1>
        <p style={{ color: "#6B5FA0", fontSize: "14px" }}>Ultima actualizacion: Mayo 2026</p>
        <hr style={{ borderColor: "#DDD6FE", marginTop: "16px" }} />
      </div>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "#5B21B6", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>1. Quienes somos</h2>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#1E1040" }}>
          KORAI es una plataforma de diagnostico de bienestar comunitario desarrollada para ayudar a personas a identificar sus necesidades y conectarlas con recursos y programas disponibles en su zona. Operamos bajo el correo <strong>koraihumandevelopment@gmail.com</strong>.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "#5B21B6", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>2. Informacion que recopilamos</h2>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#1E1040" }}>
          Recopilamos unicamente la informacion necesaria para brindarte el servicio: numero de DNI (almacenado de forma encriptada mediante hash criptografico), numero de WhatsApp (opcional, para enviarte tu plan), nombre, barrio, y respuestas al diagnostico de bienestar en las dimensiones de empleo, educacion, salud, vivienda, ingresos y red social.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "#5B21B6", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>3. Para que usamos tu informacion</h2>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#1E1040" }}>
          Tu informacion se utiliza exclusivamente para generar tu plan de bienestar personalizado, enviarte recursos y programas disponibles en tu zona, y hacer seguimiento de tu situacion a lo largo del tiempo. Tambien utilizamos datos anonimizados y agregados para mejorar los servicios comunitarios disponibles.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "#5B21B6", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>4. Como protegemos tu informacion</h2>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#1E1040" }}>
          Tu DNI nunca se almacena en texto plano: solo guardamos un hash criptografico que no permite recuperar el numero original. Toda la informacion se transmite mediante conexiones seguras (HTTPS) y se almacena en servidores con acceso restringido. No vendemos, cedemos ni compartimos tu informacion personal con terceros con fines comerciales.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "#5B21B6", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>5. Tus derechos</h2>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#1E1040" }}>
          Tenes derecho a acceder, corregir o solicitar la eliminacion de tu informacion personal en cualquier momento. Para ejercer estos derechos, contactanos en <strong>koraihumandevelopment@gmail.com</strong>. Daremos respuesta a tu solicitud en un plazo maximo de 30 dias.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "#5B21B6", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>6. Mensajes por WhatsApp</h2>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#1E1040" }}>
          Si elegiS recibir tu plan por WhatsApp, utilizamos la API de WhatsApp Business de Meta para enviarte mensajes relacionados con tu diagnostico. Podes darte de baja en cualquier momento respondiendo STOP al numero de KORAI.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "#5B21B6", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>7. Cambios a esta politica</h2>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#1E1040" }}>
          Podemos actualizar esta politica periodicamente. Cualquier cambio significativo sera notificado a traves de la aplicacion. El uso continuado del servicio implica la aceptacion de la politica vigente.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ color: "#5B21B6", fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>8. Contacto</h2>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#1E1040" }}>
          Para consultas sobre esta politica de privacidad o el tratamiento de tus datos personales, contactanos en:<br />
          <strong>Email:</strong> koraihumandevelopment@gmail.com<br />
          <strong>Sitio web:</strong> app.korai.lat
        </p>
      </section>
    </div>
  );
}
