package com.legalmetrology.services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.legalmetrology.entities.Appointment;
import com.legalmetrology.entities.Application;
import com.legalmetrology.entities.Certificate;
import com.legalmetrology.entities.Inspection;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.enums.CertificateStatus;
import com.legalmetrology.repositories.CertificateRepository;
import com.legalmetrology.repositories.InspectionRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final InspectionRepository inspectionRepository;

    @Value("${app.frontend-url:https://legal-metrology-frontend.vercel.app}")
    private String frontendUrl;

    @Transactional(readOnly = true)
    public Certificate getCertificateById(String id) {
        return certificateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    @Transactional(readOnly = true)
    public Certificate getCertificateByNumber(String number) {
        return certificateRepository.findByCertificateNumber(number)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
    }

    @Transactional(readOnly = true)
    public Certificate verifyByQrToken(String token) {
        Certificate certificate = certificateRepository.findByQrToken(token)
                .orElseThrow(() -> new RuntimeException("Certificate not found"));
        // Touch lazy relations inside transaction so they are initialized
        if (certificate.getInstrument() != null) {
            certificate.getInstrument().getManufacturer();
            if (certificate.getInstrument().getInstrumentType() != null) {
                certificate.getInstrument().getInstrumentType().getName();
            }
        }
        return certificate;
    }

    @Transactional
    public Certificate revokeCertificate(String id, String reason) {
        Certificate certificate = getCertificateById(id);
        certificate.setStatus(CertificateStatus.REVOKED);
        return certificateRepository.save(certificate);
    }

    @Transactional(readOnly = true)
    public List<Certificate> getCertificatesByBusinessId(String businessId) {
        return certificateRepository.findByBusinessId(businessId);
    }

    @Transactional(readOnly = true)
    public List<Certificate> getCertificatesForUserOrBusiness(String userId, String businessId) {
        return certificateRepository.findByBusinessIdOrUserId(businessId, userId);
    }

    @Transactional
    public Certificate generateCertificateForInspection(String inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found"));

        Appointment appointment = inspection.getAppointment();
        Application application = appointment != null ? appointment.getApplication() : null;
        Instrument instrument = application != null ? application.getInstrument() : null;

        if (instrument == null) {
            throw new RuntimeException("Instrument not found for inspection");
        }

        String certificateNumber = IdGenerator.next(Certificate.class);

        String qrToken = UUID.randomUUID().toString();

        LocalDate verificationDate = LocalDate.now();
        LocalDate validUntil = verificationDate.plusMonths(12);

        Certificate certificate = Certificate.builder()
                .id(certificateNumber)
                .certificateNumber(certificateNumber)
                .instrument(instrument)
                .inspection(inspection)
                .verificationDate(verificationDate)
                .validUntil(validUntil)
                .status(CertificateStatus.VALID)
                .qrToken(qrToken)
                .issuedBy(inspection.getInspector() != null ? inspection.getInspector().getName() : "Legal Metrology Officer")
                .build();

        return certificateRepository.save(certificate);
    }

    public byte[] generateQrCodeImage(String qrToken, int width, int height) {
        try {
            String verifyUrl = frontendUrl + "/verify/" + qrToken;
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(verifyUrl, BarcodeFormat.QR_CODE, width, height);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR Code image: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateCertificatePdf(String certificateId) {
        Certificate cert = getCertificateById(certificateId);
        Instrument inst = cert.getInstrument();

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Header Font
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.BOLD, new Color(17, 24, 39));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.NORMAL, new Color(75, 85, 99));
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD, new Color(31, 41, 55));
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, new Color(107, 114, 128));
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, new Color(17, 24, 39));

            // Header
            Paragraph title = new Paragraph("LEGAL METROLOGY DEPARTMENT", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            Paragraph subtitle = new Paragraph("GOVERNMENT OF INDIA\nCertificate of Verification & Stamping", subTitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Certificate Info Table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            table.setSpacingAfter(15);

            addTableRow(table, "Certificate Number:", cert.getCertificateNumber(), labelFont, valueFont);
            addTableRow(table, "Status:", cert.getStatus().name(), labelFont, valueFont);
            addTableRow(table, "Verification Date:", String.valueOf(cert.getVerificationDate()), labelFont, valueFont);
            addTableRow(table, "Valid Until:", String.valueOf(cert.getValidUntil()), labelFont, valueFont);
            addTableRow(table, "Issuing Officer:", cert.getIssuedBy() != null ? cert.getIssuedBy() : "Legal Metrology Officer", labelFont, valueFont);

            if (inst != null) {
                String typeName = inst.getInstrumentType() != null ? inst.getInstrumentType().getName() : "Standard Instrument";
                addTableRow(table, "Instrument Type:", typeName, labelFont, valueFont);
                addTableRow(table, "Manufacturer / Model:", inst.getManufacturer() + " / " + inst.getModel(), labelFont, valueFont);
                addTableRow(table, "Serial Number:", inst.getSerialNumber(), labelFont, valueFont);
                if (inst.getCapacityRange() != null) {
                    addTableRow(table, "Capacity / Range:", inst.getCapacityRange(), labelFont, valueFont);
                }
            }

            document.add(table);

            // QR Code Embed
            byte[] qrBytes = generateQrCodeImage(cert.getQrToken(), 140, 140);
            Image qrImage = Image.getInstance(qrBytes);
            qrImage.setAlignment(Element.ALIGN_CENTER);
            qrImage.setSpacingBefore(10);
            qrImage.setSpacingAfter(5);
            document.add(qrImage);

            Paragraph scanNote = new Paragraph("Scan QR code above with any smartphone camera to verify authenticity online.", labelFont);
            scanNote.setAlignment(Element.ALIGN_CENTER);
            scanNote.setSpacingAfter(20);
            document.add(scanNote);

            // Footer
            Paragraph footer = new Paragraph("Issued under the Legal Metrology Act, 2009 & Legal Metrology (General) Rules, 2011.", labelFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate certificate PDF: " + e.getMessage(), e);
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        PdfPCell cell1 = new PdfPCell(new Phrase(label, labelFont));
        cell1.setBorderColor(new Color(229, 231, 235));
        cell1.setPadding(6);
        table.addCell(cell1);

        PdfPCell cell2 = new PdfPCell(new Phrase(value != null ? value : "—", valueFont));
        cell2.setBorderColor(new Color(229, 231, 235));
        cell2.setPadding(6);
        table.addCell(cell2);
    }
}
