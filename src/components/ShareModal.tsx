import React from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { FacebookShareButton, TwitterShareButton, LinkedinShareButton, EmailShareButton, WhatsappShareButton } from 'react-share';
import { FacebookIcon, TwitterIcon, LinkedinIcon, EmailIcon, WhatsappIcon } from 'react-share';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'; // Importing the HeroIcons Clipboard icon

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-black bg-opacity-95 backdrop-blur-xl p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" className="text-lg font-medium leading-6 text-white text-center mb-6">
                  Share the Mobile Climate Mapper
                </DialogTitle>
                <div className="mt-2 flex justify-around">
                  <FacebookShareButton url={window.location.href}>
                    <FacebookIcon size={40} round />
                  </FacebookShareButton>
                  <TwitterShareButton url={window.location.href}>
                    <TwitterIcon size={40} round />
                  </TwitterShareButton>
                  <LinkedinShareButton url={window.location.href}>
                    <LinkedinIcon size={40} round />
                  </LinkedinShareButton>
                  <EmailShareButton url={window.location.href}>
                    <EmailIcon size={40} round />
                  </EmailShareButton>
                  <WhatsappShareButton url={window.location.href}>
                    <WhatsappIcon size={40} round />
                  </WhatsappShareButton>

                  <button
                    onClick={handleCopyLink}
                    className="bg-gray-200 rounded-full p-2 hover:bg-gray-300 transition"
                    aria-label="Copy link"
                  >
                    <ClipboardDocumentIcon className="h-7 w-7 text-gray-700" />
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ShareModal;
