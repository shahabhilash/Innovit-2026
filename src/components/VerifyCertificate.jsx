import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertCircle, CheckCircle, ArrowLeft, Loader2, Award } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Papa from 'papaparse';
import QRCode from 'qrcode';

const themes = [
  { id: 'TH01', name: 'Open Innovation', color: '#FF9933' },
  { id: 'TH02', name: 'Heritage & Culture', color: '#FFFFFF' },
  { id: 'TH03', name: 'MedTech / BioTech / HealthTech', color: '#138808' },
  { id: 'TH04', name: 'Agriculture, FoodTech & Rural Development', color: '#FF9933' },
  { id: 'TH05', name: 'Blockchain & Cybersecurity', color: '#1E3A8A' }
];

const VerifyCertificate = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [certificateId, setCertificateId] = useState(searchParams.get('id') || '');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [verifiedTheme, setVerifiedTheme] = useState(null);
    const [results, setResults] = useState({});

    // Load CSV results
    useEffect(() => {
        const loadAllResults = async () => {
            const resultsData = {};
            for (const theme of themes) {
                try {
                    const response = await fetch(`/Result-Phase-1/${theme.id}.csv`);
                    if (!response.ok) throw new Error(`Failed to fetch ${theme.id}.csv`);
                    const csvText = await response.text();
                    const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
                    resultsData[theme.id] = result.data;
                } catch (error) {
                    console.error(`Error loading ${theme.id}:`, error);
                    resultsData[theme.id] = [];
                }
            }
            setResults(resultsData);
        };
        loadAllResults();
    }, []);

    // Clean up PDF preview URL on unmount
    useEffect(() => {
        return () => {
            if (pdfPreviewUrl) {
                URL.revokeObjectURL(pdfPreviewUrl);
            }
        };
    }, [pdfPreviewUrl]);

    // Auto-verify if ID is in URL
    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl && Object.keys(results).length > 0) {
            handleVerify(idFromUrl);
        }
    }, [results]);

    const generateCertificateBlob = async (userData, verifiedTheme) => {
        const templateUrl = '/phase-1-innovit_certitcate (1).pdf';
        const response = await fetch(templateUrl);
        if (!response.ok) throw new Error('Failed to download template');
        const templateBytes = await response.arrayBuffer();

        const pdfDoc = await PDFDocument.load(templateBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const { width, height } = firstPage.getSize();

        const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);

        const formatToTitleCase = (str) => {
            if (!str) return '';
            return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        const displayName = formatToTitleCase(userData.name);
        const displayTeam = formatToTitleCase(userData.team);
        const combinedNameTeam = `${displayName} | Team: ${displayTeam}`;

        const nameFontSize = 24;
        const nameWidth = fontBold.widthOfTextAtSize(combinedNameTeam, nameFontSize);

        firstPage.drawText(combinedNameTeam, {
            x: width / 2 - nameWidth / 2 + 85,
            y: height - 262,
            size: nameFontSize,
            font: fontBold,
            color: rgb(0, 0, 0),
        });

        const themeText = `${verifiedTheme.id} : ${verifiedTheme.name}`;
        const themeFontSize = 22;
        const themeWidth = fontRegular.widthOfTextAtSize(themeText, themeFontSize);
        firstPage.drawText(themeText, {
            x: width / 2 - themeWidth / 2 + 85,
            y: height - 377,
            size: themeFontSize,
            font: fontRegular,
            color: rgb(0.12, 0.16, 0.22),
        });

        const today = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const dateFontSize = 12;
        firstPage.drawText(today, {
            x: 180,
            y: height - 718,
            size: dateFontSize,
            font: fontRegular,
            color: rgb(0.12, 0.16, 0.22),
        });

        if (userData.certificate_hash_id) {
            const hashText = `Certificate ID: ${userData.certificate_hash_id}`;
            const hashFontSize = 9;
            const hashWidth = fontRegular.widthOfTextAtSize(hashText, hashFontSize);

            firstPage.drawText(hashText, {
                x: width / 2 - hashWidth / 2 + 85,
                y: 25,
                size: hashFontSize,
                font: fontRegular,
                color: rgb(0.3, 0.3, 0.3),
            });

            const verifyUrl = `https://innovit-2026.blockchainvitb.in/verify-certificate?id=${userData.certificate_hash_id}`;
            try {
                const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
                    width: 100,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF00'
                    }
                });

                const qrImageBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer());
                const qrImage = await pdfDoc.embedPng(qrImageBytes);

                firstPage.drawImage(qrImage, {
                    x: width / 2 - 25 + 85,
                    y: 40,
                    width: 50,
                    height: 50,
                });
            } catch (qrError) {
                console.error('Error generating QR code:', qrError);
            }
        }

        const pdfBytes = await pdfDoc.save();
        return new Blob([pdfBytes], { type: 'application/pdf' });
    };

    const handleVerify = async (idToVerify = certificateId) => {
        if (!idToVerify.trim()) {
            toast.error('Please enter a Certificate ID');
            return;
        }

        setIsVerifying(true);
        setVerificationResult(null);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('id_card_users')
                .select('*')
                .eq('certificate_hash_id', idToVerify.trim())
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setVerificationResult(data);
                toast.success('Certificate Verified Successfully!');

                // Find theme from CSV
                const normalizeString = (str) => {
                    if (!str) return '';
                    return str.toLowerCase().trim().replace(/\s+/g, ' ');
                };

                let foundTheme = null;
                const searchTeamName = normalizeString(data.team || '');
                
                for (const theme of themes) {
                    const csvData = results[theme.id] || [];
                    const teamMatch = csvData.find(p => {
                        const csvTeamName = normalizeString(p['Team Name'] || '');
                        return csvTeamName === searchTeamName;
                    });
                    
                    if (teamMatch) {
                        foundTheme = theme;
                        break;
                    }
                }

                if (foundTheme) {
                    setVerifiedTheme(foundTheme);
                    
                    // Generate PDF preview
                    setIsPreviewLoading(true);
                    try {
                        if (pdfPreviewUrl) {
                            URL.revokeObjectURL(pdfPreviewUrl);
                        }
                        const blob = await generateCertificateBlob(data, foundTheme);
                        const url = URL.createObjectURL(blob);
                        setPdfPreviewUrl(url);
                    } catch (error) {
                        console.error('Preview generation failed', error);
                    } finally {
                        setIsPreviewLoading(false);
                    }
                }
            } else {
                setError('Certificate invalid or not found.');
                toast.error('Certificate not found');
            }
        } catch (err) {
            console.error('Verification failed:', err);
            setError('An error occurred during verification. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="min-h-screen w-full pt-24 pb-12 px-4 relative overflow-hidden bg-[#0a0a0f]">
            <Toaster position="top-center" />

            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 mb-8 text-gray-400 transition-colors hover:text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Home</span>
                </motion.button>

                <div className="mb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full bg-green-500/10 border-green-500/20"
                    >
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold tracking-wider text-green-500 uppercase">Official Verification</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 text-4xl font-black text-white md:text-5xl"
                    >
                        Verify Certificate
                    </motion.h1>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-strong p-8 rounded-3xl border border-white/10 bg-[#111]/80 backdrop-blur-xl shadow-2xl"
                >
                    <div className="flex flex-col gap-4 mb-8 md:flex-row">
                        <div className="relative flex-1">
                            <div className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={certificateId}
                                onChange={(e) => setCertificateId(e.target.value)}
                                placeholder="Enter Certificate ID"
                                className="w-full pl-12 pr-4 py-4 bg-[#0a0a0f]/80 border border-white/10 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all font-mono"
                            />
                        </div>
                        <button
                            onClick={() => handleVerify()}
                            disabled={!certificateId || isVerifying}
                            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                        >
                            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {verificationResult && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-6 border bg-green-500/5 border-green-500/20 rounded-2xl md:p-8"
                            >
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="p-3 bg-green-500/20 rounded-xl">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="mb-1 text-xl font-bold text-white">Valid Certificate</h3>
                                        <p className="text-sm text-green-400/80">This certificate is authentic and issued by INNOVIT 2026.</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Issued To</label>
                                        <p className="text-lg font-medium text-white">{verificationResult.name}</p>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Team</label>
                                        <p className="text-lg font-medium text-white">{verificationResult.team}</p>
                                    </div>
                                    {/* Since themes are not in Supabase user table directly but derived or potentialy saved, 
                      we might not display Theme unless we save it or re-derive it. 
                      However, the certificate issuance saves the hash. 
                      If theme is not in user table, we might skip it or re-calculate it if we had the logic here.
                      For now, showing Name and Team is primary verification.
                  */}
                                    <div className="md:col-span-2">
                                        <label className="block mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Certificate ID</label>
                                        <p className="inline-block px-3 py-1 font-mono text-green-400 border rounded-lg bg-green-500/10 border-green-500/20">
                                            {verificationResult.certificate_hash_id}
                                        </p>
                                    </div>
                                    {verifiedTheme && (
                                        <div className="md:col-span-2">
                                            <label className="block mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Theme</label>
                                            <p className="text-lg font-medium text-white">{verifiedTheme.id} - {verifiedTheme.name}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* PDF Preview Section */}
                        {verificationResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-8"
                            >
                                <h3 className="flex items-center gap-2 mb-4 text-xl font-bold text-white">
                                    <Award className="w-6 h-6 text-green-500" />
                                    Certificate Preview
                                </h3>
                                
                                {isPreviewLoading ? (
                                    <div className="bg-[#0a0a0f]/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center">
                                        <Loader2 className="w-10 h-10 mb-4 text-green-500 animate-spin" />
                                        <p className="text-gray-400">Generating certificate preview...</p>
                                    </div>
                                ) : pdfPreviewUrl ? (
                                    <div className="relative w-full aspect-[1.414/1] bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                                        <iframe
                                            src={`${pdfPreviewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                            className="absolute inset-0 w-full h-full border-none"
                                            title="Certificate PDF Preview"
                                        />
                                        <div className="absolute inset-0 border-2 pointer-events-none border-green-500/20 rounded-2xl" />
                                    </div>
                                ) : null}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-4 p-6 border bg-red-500/5 border-red-500/20 rounded-2xl"
                            >
                                <AlertCircle className="w-8 h-8 text-red-500" />
                                <div>
                                    <h3 className="text-lg font-bold text-red-400">Verification Failed</h3>
                                    <p className="text-sm text-red-400/80">{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default VerifyCertificate;
