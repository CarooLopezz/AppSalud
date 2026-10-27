# AppSalud — Documento de la problemática

## 1. Contexto

La información de salud de una persona se genera en muchos lugares distintos y a lo largo de toda su vida: análisis y estudios en distintos laboratorios y centros médicos, recetas y tratamientos de diferentes profesionales, controles con especialistas, turnos en varias instituciones. Cada uno de esos lugares guarda **solo una parte**, en su propio sistema o en papel, y rara vez esa información está conectada.

Como resultado, la persona termina siendo la única que debería tener la foto completa de su salud, pero en la práctica no cuenta con ninguna herramienta propia para reunirla y tenerla a mano.

## 2. El problema

**La información de salud personal está fragmentada y dispersa, y no hay un lugar propio y seguro donde la persona la reúna, la conserve y la consulte cuando la necesita.**

Hoy, para juntar sus propios datos, una persona suele depender de:

- Carpetas con estudios en papel que se pierden, se arruinan o se olvidan en casa justo el día de la consulta.
- Fotos sueltas de recetas y resultados en el teléfono, sin orden ni fácil de encontrar.
- La memoria, para recordar qué medicamento toma, en qué dosis, desde cuándo y hasta cuándo, o cuándo fue el último control.
- Pedirle de nuevo al médico o al laboratorio estudios que ya tenía, porque no los encuentra.

## 3. A quiénes afecta

- **Pacientes en general**, que necesitan llevar su historial a una consulta o compartirlo con un nuevo profesional.
- **Personas con tratamientos prolongados o crónicos**, que manejan varias recetas y controles al mismo tiempo y para quienes un olvido tiene consecuencias concretas.
- **Personas mayores o quienes cuidan a un familiar**, que gestionan la salud de otra persona y necesitan tener todo ordenado y accesible.

## 4. Consecuencias

- **Pérdida de tiempo y repetición de estudios** (y del gasto asociado) cuando la información no aparece.
- **Decisiones médicas con datos incompletos**, porque el profesional no tiene a la vista el historial.
- **Errores en la medicación**: tomar una dosis equivocada, repetir un medicamento o continuar un tratamiento ya vencido.
- **Controles que se pasan de fecha** por no tener un recordatorio.
- **Riesgo para la privacidad**, cuando los datos de salud circulan por medios inseguros (chats, fotos, correos sin protección).

## 5. Objetivo del proyecto

Darle a la persona **una agenda personal de salud**: un único lugar, propio y seguro, donde pueda reunir y consultar su información de salud, con la garantía de que **solo ella accede a sus datos**.

## 6. Solución propuesta: AppSalud

AppSalud es una aplicación web donde cada persona, con su propia cuenta, puede:

- **Guardar y consultar sus estudios médicos**, ordenados y siempre disponibles.
- **Registrar sus recetas y medicamentos**, con sus dosis y fechas, y recibir un aviso de las recetas próximas a vencer.
- **Tener a mano el directorio de médicos** y gestionar sus turnos.

Cada usuario entra con su cuenta y **solo ve y modifica su propia información**: los datos de una persona nunca son accesibles para otra.

## 7. La seguridad como parte del problema

En una aplicación de salud, proteger los datos no es un extra: es parte de resolver bien el problema. Por eso AppSalud se diseñó teniendo en cuenta, desde el principio:

- **Las contraseñas nunca se guardan tal cual**, sino encriptadas.
- **La información viaja cifrada** entre el navegador y el servidor (HTTPS), de modo que no pueda leerse si alguien observa la red.
- **El acceso a los datos está protegido** con inicio de sesión, y cada usuario queda aislado del resto.
- **El login está protegido contra intentos de adivinar contraseñas** (fuerza bruta), limitando la cantidad de intentos.

## 8. Alcance

**Incluye:** cuentas de usuario (pacientes y médicos), estudios, recetas y medicamentos, directorio de médicos y agenda de turnos, con las medidas de seguridad descritas.

**No incluye (queda fuera de esta versión):** la integración automática con sistemas de laboratorios, obras sociales u hospitales; la carga de datos la realiza la propia persona o su médico dentro de la aplicación.
