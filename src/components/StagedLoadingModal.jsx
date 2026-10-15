import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  Progress,
  Box,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

/**
 * Staged Loading Modal sesuai spesifikasi Issue #12:
 * - 0% -> 50% dalam 3 detik
 * - Pause di 50% selama 2 detik
 * - 50% -> 100% dalam 2 detik
 * - Setelah 100%, modal tertutup dan memicu callback `onComplete`.
 */
export default function StagedLoadingModal({ isOpen, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Menyiapkan data analytics...");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Semua transisi lewat timeout, termasuk langkah pertama: setState
    // sinkron langsung di body effect memicu cascading render
    // (rule react-hooks/set-state-in-effect).
    const t0 = setTimeout(() => {
      setProgress(10);
      setStatusText("Menganalisis performa konten...");
    }, 0);

    const t1 = setTimeout(() => {
      setProgress(30);
      setStatusText("Menghitung Engagement Rate & CPM...");
    }, 1000);

    const t2 = setTimeout(() => {
      setProgress(50);
      setStatusText("Menyusun komponen Rate Card...");
    }, 3000);

    // Pause di 50% selama 2 detik (spesifikasi Issue #12).
    const t3 = setTimeout(() => {
      setProgress(75);
      setStatusText("Memvalidasi format dan standar harga...");
    }, 5000);

    const t4 = setTimeout(() => {
      setProgress(100);
      setStatusText("Rate Card siap!");
      const finishTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 400);
      return () => clearTimeout(finishTimer);
    }, 7000);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, onComplete]);

  return (
    <Modal isOpen={isOpen} onClose={() => {}} isCentered closeOnOverlayClick={false}>
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent color="fgInverse" p={6} borderRadius="2xl">
        <ModalHeader textAlign="center" pb={2}>
          <Text fontSize="xl" fontWeight="bold">
            Membuat Rate Card Anda
          </Text>
        </ModalHeader>
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Text textAlign="center" fontSize="sm" color="mutedInverse">
              {statusText}
            </Text>
            <Progress
              value={progress}
              size="lg"
              colorScheme="pink"
              borderRadius="full"
              hasStripe
              isAnimated
            />
            <Text textAlign="right" fontSize="xs" color="mutedInverse">
              {progress}%
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
