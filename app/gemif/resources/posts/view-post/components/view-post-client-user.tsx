'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SanitizedAppError } from '@/lib/errors/types';
import { isSuccess } from '@/lib/errors/result';
import ErrorPopup from '@/app/ui/error-popup';
import { deleteResourcesPost } from '../actions/actions';



export default function ViewPostClientUser() {

  return (
    <div className="panel-footer w-full flex-none flex justify-start gap-2 items-center border-t border-border">
      <Link href={"/gemif/resources/posts"} className="btn btn-secondary">
        Cerrar
      </Link>
      <button disabled className="btn btn-danger opacity-60">
        Eliminar publicación
      </button>
      <div className="btn btn-primary opacity-60">
        Editar publicación
      </div>
    </div>
  );
}
