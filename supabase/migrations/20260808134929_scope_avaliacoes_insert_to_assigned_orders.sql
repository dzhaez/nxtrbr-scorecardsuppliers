/*
  # Restrict evaluations to assigned suppliers and cycles (F2)

  `insert_avaliacoes` bound only the author, so a signed-in buyer could POST an
  evaluation for any `codigo_fornecedor` in any `ciclo`. The new predicate also
  requires a matching purchase order for that supplier, that cycle and that
  caller. Admins keep their existing ability to insert.
*/

DROP POLICY IF EXISTS insert_avaliacoes ON public.avaliacoes;

CREATE POLICY insert_avaliacoes ON public.avaliacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_user()
    OR (
      lower(id_usuario) = lower(get_id_usuario())
      AND EXISTS (
        SELECT 1 FROM public.ordens_compra o
        WHERE o.codigo_fornecedor = avaliacoes.codigo_fornecedor
          AND o.ciclo = avaliacoes.ciclo
          AND lower(o.id_usuario) = lower(get_id_usuario())
      )
    )
  );
