const nodemailer = require('nodemailer');

const DEFAULT_TARGET_EMAIL = 'pailoto0717@gmail.com';

function createTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        throw new Error('SMTP no configurado: define SMTP_USER y SMTP_PASS en back/.env');
    }

    return nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: { user, pass }
    });
}

/**
 * Envía por correo el Comprobante Fiscal / Factura a pailoto0717@gmail.com
 */
async function enviarComprobanteFiscalEmail(data) {
    const {
        folio = 'OR-00000',
        fecha = new Date().toLocaleString('es-MX'),
        cliente = {},
        datosFiscales = {},
        items = [],
        subtotal = 0,
        impuesto = 0,
        descuento = 0,
        total = 0,
        metodoPago = 'Monedero',
        saldoActualMonedero = null
    } = data;

    const destinatario = process.env.FISCAL_EMAIL_DESTINO || DEFAULT_TARGET_EMAIL;
    const clientName = cliente.nombre || cliente.name || 'Cliente';
    const rawClientEmail = typeof cliente.email === 'string' ? cliente.email.trim() : '';
    const clientEmail = rawClientEmail || 'cliente@ejemplo.com';
    const customerEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawClientEmail)
        && rawClientEmail.toLowerCase() !== destinatario.trim().toLowerCase()
        ? rawClientEmail
        : null;
    const clientAddress = cliente.direccion || cliente.address || 'Mostrador / Domicilio';
    const rfc = (datosFiscales && datosFiscales.rfc) || 'XAXX010101000';
    const razonSocial = (datosFiscales && datosFiscales.razonSocial) || clientName;
    const regimen = (datosFiscales && datosFiscales.regimen) || '616 - Régimen de Personas Físicas / General';
    const usoCfdi = (datosFiscales && datosFiscales.uso) || 'G03 - Gastos en general';

    const itemsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 8px; text-align: center; color: #475569;">${item.quantity || 1}</td>
            <td style="padding: 10px 8px; color: #1e293b;">
                <strong>${item.name || 'Producto'}</strong>
            </td>
            <td style="padding: 10px 8px; text-align: right; color: #475569;">$${Number(item.price || 0).toFixed(2)}</td>
            <td style="padding: 10px 8px; text-align: right; color: #1e293b; font-weight: 600;">$${Number(item.subtotal || ((item.price || 0) * (item.quantity || 1))).toFixed(2)}</td>
        </tr>
    `).join('');

    const saldoMonederoHtml = (saldoActualMonedero !== null && saldoActualMonedero !== undefined)
        ? `<tr>
            <td colspan="3" style="padding: 6px 8px; text-align: right; color: #059669; font-weight: 600;">Saldo restante en Monedero:</td>
            <td style="padding: 6px 8px; text-align: right; color: #059669; font-weight: 700;">$${Number(saldoActualMonedero).toFixed(2)}</td>
           </tr>`
        : '';

    const descuentoHtml = descuento > 0
        ? `<tr>
            <td colspan="3" style="padding: 6px 8px; text-align: right; color: #dc2626;">Descuento promoción:</td>
            <td style="padding: 6px 8px; text-align: right; color: #dc2626; font-weight: 600;">-$${Number(descuento).toFixed(2)}</td>
           </tr>`
        : '';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Comprobante Fiscal - ${folio}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
        <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
            
            <!-- Encabezado Emisor -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.5px;">Delicias<span>Resto</span></h1>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Comprobante Fiscal Digital / Ticket de Venta</p>
            </div>

            <!-- Datos de Emisor y Folio -->
            <div style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
                    <div>
                        <strong style="color: #0f172a; font-size: 15px;">EMISOR: DeliciasResto S.A. de C.V.</strong><br>
                        <span style="font-size: 13px; color: #64748b;">RFC: DRE-123456-789</span><br>
                        <span style="font-size: 13px; color: #64748b;">Régimen: 601 - General de Ley Personas Morales</span><br>
                        <span style="font-size: 13px; color: #64748b;">Av. Tecnológico #123, Querétaro, México</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: inline-block; background: #ede9fe; color: #6d28d9; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 14px;">FOLIO: ${folio}</span><br>
                        <span style="font-size: 12px; color: #64748b; margin-top: 4px; display: inline-block;">Fecha: ${fecha}</span><br>
                        <span style="font-size: 12px; color: #64748b;">Método: <strong>${metodoPago}</strong></span>
                    </div>
                </div>

                <!-- Datos del Receptor / Cliente -->
                <div style="background: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Datos del Receptor (Cliente)</div>
                    <div style="font-size: 13px; color: #1e293b; line-height: 1.5;">
                        <strong>Nombre / Razón Social:</strong> ${razonSocial}<br>
                        <strong>RFC:</strong> ${rfc} &nbsp;|&nbsp; <strong>Uso CFDI:</strong> ${usoCfdi}<br>
                        <strong>Correo:</strong> ${clientEmail}<br>
                        <strong>Dirección:</strong> ${clientAddress}
                    </div>
                </div>

                <!-- Detalle de Productos -->
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #f1f5f9; color: #475569; text-align: left;">
                            <th style="padding: 10px 8px; text-align: center; width: 60px;">Cant.</th>
                            <th style="padding: 10px 8px;">Descripción</th>
                            <th style="padding: 10px 8px; text-align: right; width: 90px;">P. Unit</th>
                            <th style="padding: 10px 8px; text-align: right; width: 100px;">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 10px 8px 4px; text-align: right; color: #475569;">Subtotal:</td>
                            <td style="padding: 10px 8px 4px; text-align: right; color: #1e293b; font-weight: 600;">$${Number(subtotal).toFixed(2)}</td>
                        </tr>
                        ${descuentoHtml}
                        <tr>
                            <td colspan="3" style="padding: 4px 8px; text-align: right; color: #475569;">Impuestos (IVA 16%):</td>
                            <td style="padding: 4px 8px; text-align: right; color: #1e293b; font-weight: 600;">$${Number(impuesto).toFixed(2)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #e2e8f0; font-size: 15px;">
                            <td colspan="3" style="padding: 10px 8px; text-align: right; color: #0f172a; font-weight: 800;">TOTAL:</td>
                            <td style="padding: 10px 8px; text-align: right; color: #7c3aed; font-weight: 800; font-size: 18px;">$${Number(total).toFixed(2)}</td>
                        </tr>
                        ${saldoMonederoHtml}
                    </tfoot>
                </table>

                <!-- Timbre / Sello Fiscal Digital -->
                <div style="background: #faf5ff; border: 1px dashed #c084fc; border-radius: 8px; padding: 12px; margin-top: 15px; font-size: 11px; color: #6b21a8; line-height: 1.4;">
                    <strong>Cadena Original del Complemento de Certificación Fiscal Digital:</strong><br>
                    <span style="font-family: monospace; word-break: break-all; color: #7e22ce;">
                        ||1.1|${folio}|${new Date().toISOString()}|DRE123456789|${Number(total).toFixed(2)}|MXN|${metodoPago}|00001000000504465028||
                    </span><br>
                    <strong>Sello Digital del Emisor:</strong><br>
                    <span style="font-family: monospace; word-break: break-all; color: #7e22ce;">
                        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtX9Yw2z+7DeliciasRestoFiscal2026==
                    </span>
                </div>

                <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
                    Este correo se envía automáticamente al registrarse el pago y emitirse el comprobante fiscal en la plataforma de comercio electrónico.<br>
                    Copia enviada a: <strong>${destinatario}</strong>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const transporter = createTransporter();
    const mailOptions = {
        from: `"DeliciasResto Fiscal" <${process.env.SMTP_USER || 'facturacion@deliciasresto.com'}>`,
        to: destinatario,
        ...(customerEmail ? { cc: customerEmail } : {}),
        subject: `Comprobante Fiscal de Compra - ${folio} ($${Number(total).toFixed(2)})`,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[MAILER] Comprobante fiscal enviado exitosamente a ${destinatario} (Folio: ${folio})`);
        return {
            success: true,
            destinatario,
            messageId: info.messageId,
            preview: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null
        };
    } catch (err) {
        console.error(`[MAILER ERROR] Error al enviar comprobante a ${destinatario}:`, err.message);
        return {
            success: false,
            destinatario,
            error: err.message
        };
    }
}

module.exports = {
    enviarComprobanteFiscalEmail,
    DEFAULT_TARGET_EMAIL
};
