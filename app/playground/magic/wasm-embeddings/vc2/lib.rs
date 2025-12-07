use nalgebra::DVector;
use nalgebra_sparse::{CsrMatrix, coo::CooMatrix};
use std::f64::consts::PI;
use wasm_bindgen::prelude::*;

// --- Constants ---
const SIGMA_SB: f64 = 5.670374419e-8;
const Q_SOLAR: f64 = 1000.0;
const T_INFINITY_C: f64 = 25.0;
const T_INFINITY_K: f64 = T_INFINITY_C + 273.15;

// Material Properties struct
#[derive(Clone, Copy)]
struct Material {
    kt: f64,
    emi: f64,
}

const MAT_SI: Material = Material {
    kt: 148.0,
    emi: 0.9,
};
const MAT_CU: Material = Material {
    kt: 400.0,
    emi: 0.7,
};
const MAT_AL: Material = Material {
    kt: 237.0,
    emi: 0.8,
};
const MAT_REF: Material = Material {
    kt: 430.0,
    emi: 0.05,
};

#[wasm_bindgen]
pub struct SimulationResult {
    t_max: f64,
    p_elec_total: f64,
    t_3d_flat: Vec<f64>,
    nx: usize,
    ny: usize,
    nz: usize,
}

#[wasm_bindgen]
impl SimulationResult {
    pub fn get_t_max(&self) -> f64 {
        self.t_max
    }
    pub fn get_p_elec(&self) -> f64 {
        self.p_elec_total
    }
    pub fn get_t_3d(&self) -> Vec<f64> {
        self.t_3d_flat.clone()
    }
    pub fn get_nx(&self) -> usize {
        self.nx
    }
    pub fn get_ny(&self) -> usize {
        self.ny
    }
    pub fn get_nz(&self) -> usize {
        self.nz
    }
}

fn eta_cell(concentration_suns: f64) -> f64 {
    if concentration_suns <= 0.0 {
        return 0.0;
    }
    let log_c = concentration_suns.log10();
    (-1.83551021 * log_c.powi(2) + 10.33938856 * log_c + 31.75105977) / 100.0
}

struct RadBoundary {
    idx: usize,
    factor: f64, // Area * Emi * Sigma_SB
}

#[wasm_bindgen]
pub fn run_thermal_simulation(
    fwhm: f64,
    magic_area: f64,
    n_matrix: usize,
    layer_thickness: f64,   // Added parameter
    plate_dimension: f64,   // Added parameter
    cpv_scale: f64,         // Added parameter
    n_xy_param: usize,      // Added parameter (renamed to avoid conflict)
    n_z_layer: usize,       // Added parameter
    use_circular_cpv: bool, // Added parameter
) -> SimulationResult {
    // --- 1. Grid Setup ---
    let l_xy_total = plate_dimension; // Use parameter
    let l_xy = l_xy_total / 2.0;
    let l = plate_dimension; // Use parameter
    let l_z_plate = layer_thickness; // Use parameter
    let l_z_sink = 0.01;
    let l_z_total = l_z_plate + l_z_sink;
    let n_xy = n_xy_param; // Use parameter

    let linspace = |start: f64, end: f64, n: usize| -> Vec<f64> {
        if n == 1 {
            return vec![start];
        }
        let step = (end - start) / (n as f64 - 1.0);
        (0..n).map(|i| start + i as f64 * step).collect()
    };

    let x = linspace(0.0, l_xy, n_xy);
    let dx = x[1] - x[0];
    let y = linspace(0.0, l_xy, n_xy);
    let dy = y[1] - y[0];

    // Z Grid Construction
    let mut z_points = Vec::new();
    z_points.extend(linspace(0.0, l_z_sink, 5));
    // Use n_z_layer parameter here
    z_points.extend(linspace(l_z_sink, l_z_total - 0.002, n_z_layer));

    // Skin offsets
    let skin_offsets = vec![0.002, 0.0005, 0.0001, 0.00001, 0.0];
    for off in skin_offsets {
        z_points.push(l_z_total - off);
    }

    // Sort and Unique (dedup)
    z_points.sort_by(|a, b| a.partial_cmp(b).unwrap());
    z_points.dedup_by(|a, b| (*a - *b).abs() < 1e-12);

    let z = z_points;
    let nz = z.len();
    let n_total = n_xy * n_xy * nz;

    // Volume weights
    let mut wz = vec![0.0; nz];
    let mut dz_intervals = vec![0.0; nz - 1];
    for k in 0..nz - 1 {
        dz_intervals[k] = z[k + 1] - z[k];
    }
    wz[0] = dz_intervals[0] / 2.0;
    for k in 1..nz - 1 {
        wz[k] = (dz_intervals[k - 1] + dz_intervals[k]) / 2.0;
    }
    wz[nz - 1] = dz_intervals[nz - 2] / 2.0;

    // --- 2. CPV Geometry ---
    let spacing = l / (n_matrix as f64);
    let n_cpv_total = n_matrix * n_matrix;
    let mut centers = Vec::with_capacity(n_cpv_total);
    let mut cell_rads = Vec::with_capacity(n_cpv_total);

    for idx_row in 0..n_matrix {
        for idx_col in 0..n_matrix {
            let cx = (idx_col as f64 - (n_matrix as f64 - 1.0) / 2.0) * spacing;
            let cy = (idx_row as f64 - (n_matrix as f64 - 1.0) / 2.0) * spacing;
            centers.push((cx, cy));
            // Use cpv_scale parameter
            cell_rads.push((cpv_scale * spacing) / 2.0);
        }
    }

    // --- 3. Indexing Helper (Column-Major: Y, X, Z) ---
    // Rust idx = j + i*Ny + k*Ny*Nx (0-based)
    let get_idx =
        |i_x: usize, j_y: usize, k_z: usize| -> usize { j_y + i_x * n_xy + k_z * n_xy * n_xy };

    // Area Accessors matching MATLAB's Wy .* Wz logic
    let get_ax = |j_y: usize, k_z: usize| -> f64 {
        let wy_val = if j_y == 0 || j_y == n_xy - 1 {
            dy / 2.0
        } else {
            dy
        };
        wy_val * wz[k_z]
    };
    let get_ay = |i_x: usize, k_z: usize| -> f64 {
        let wx_val = if i_x == 0 || i_x == n_xy - 1 {
            dx / 2.0
        } else {
            dx
        };
        wx_val * wz[k_z]
    };
    let get_az = |i_x: usize, j_y: usize| -> f64 {
        let wx_val = if i_x == 0 || i_x == n_xy - 1 {
            dx / 2.0
        } else {
            dx
        };
        let wy_val = if j_y == 0 || j_y == n_xy - 1 {
            dy / 2.0
        } else {
            dy
        };
        wx_val * wy_val
    };

    // --- 4. Material Allocation & CPV Mask ---
    let mut kt_vec = vec![0.0; n_total];
    let mut emi_vec = vec![0.0; n_total];
    let mut rad_boundaries = Vec::new();

    // Pre-calculate CPV Mask (2D)
    let mut cpv_mask = vec![false; n_xy * n_xy]; // indexed by j + i*n_xy

    // First pass to determine mask
    for i in 0..n_xy {
        for j in 0..n_xy {
            let cx = x[i];
            let cy = y[j];
            let mut inside = false;
            for p in 0..n_cpv_total {
                let (ccx, ccy) = centers[p];
                let radius = cell_rads[p];
                let dist_x = (cx - ccx).abs();
                let dist_y = (cy - ccy).abs();

                let is_in_shape = if use_circular_cpv {
                    // Circular shape check
                    (dist_x * dist_x) + (dist_y * dist_y) <= (radius * radius)
                } else {
                    // Square shape check
                    dist_x <= radius && dist_y <= radius
                };

                if is_in_shape {
                    inside = true;
                    break;
                }
            }
            if inside {
                cpv_mask[j + i * n_xy] = true;
            }
        }
    }

    // Material Loop
    for k in 0..nz {
        for i in 0..n_xy {
            for j in 0..n_xy {
                let idx = get_idx(i, j, k);
                let cz = z[k];

                let mut mat = MAT_CU;

                if cz <= l_z_sink + 1e-6 {
                    mat = MAT_AL;
                } else if cz > l_z_total - 0.0002 {
                    // Use pre-computed mask
                    if cpv_mask[j + i * n_xy] {
                        mat = MAT_SI;
                    } else {
                        mat = MAT_REF;
                    }
                }

                kt_vec[idx] = mat.kt;
                emi_vec[idx] = mat.emi; // Store emi for radiation calc later

                // --- Boundary Identification ---
                let mut is_boundary = false;
                let mut area_acc = 0.0;

                // Top (Z Max)
                if k == nz - 1 {
                    is_boundary = true;
                    area_acc += get_az(i, j);
                }
                // Bottom (Z Min)
                if k == 0 {
                    is_boundary = true;
                    area_acc += get_az(i, j);
                }
                // Right (X Max) -> i = N-1
                if i == n_xy - 1 {
                    is_boundary = true;
                    area_acc += get_ax(j, k);
                }
                // Front (Y Max) -> j = N-1
                if j == n_xy - 1 {
                    is_boundary = true;
                    area_acc += get_ay(i, k);
                }

                if is_boundary {
                    let factor = area_acc * mat.emi * SIGMA_SB;
                    rad_boundaries.push(RadBoundary { idx, factor });
                }
            }
        }
    }

    // --- 5. Heat Sources (Gaussian) ---
    // Note: Gaussian source logic remains circular as it describes light focus,
    // but material absorption (eta_cell vs 0.05) is controlled by cpv_mask which now respects the shape.
    let q_concentrated = magic_area * Q_SOLAR;
    let sigma_g = fwhm / 2.35;
    let a_tot = q_concentrated / (2.0 * PI * sigma_g.powi(2));
    let a_cpv = (1.0 / n_cpv_total as f64) * a_tot;

    let mut q_source_vec = DVector::zeros(n_total);

    // Only apply source at top layer (k = nz-1)
    let k_top = nz - 1;
    for i in 0..n_xy {
        for j in 0..n_xy {
            let idx = get_idx(i, j, k_top);
            let cx = x[i];
            let cy = y[j];

            let mut q_sum = 0.0;
            for p in 0..n_cpv_total {
                let (ccx, ccy) = centers[p];
                let r2 = (cx - ccx).powi(2) + (cy - ccy).powi(2);
                q_sum += a_cpv * (-r2 / (2.0 * sigma_g.powi(2))).exp();
            }

            let q_tot = Q_SOLAR * 0.1 + q_sum;
            let suns = q_tot / 1000.0;

            let q_in;
            if cpv_mask[j + i * n_xy] {
                q_in = q_tot * (1.0 - eta_cell(suns));
            } else {
                q_in = q_tot * 0.05;
            }

            let az_face = get_az(i, j);
            q_source_vec[idx] = q_in * az_face;
        }
    }

    // --- 6. Matrix Assembly (Conduction + Linear Convection) ---
    let mut coo = CooMatrix::new(n_total, n_total);
    let mut b_base = DVector::zeros(n_total);
    b_base += &q_source_vec;

    // Convection Params
    let fin_height = 0.02;
    let fin_thickness = 0.001;
    let fin_spacing = 0.005;
    let n_fins_x = (l_xy_total / (fin_thickness + fin_spacing)).floor();
    let fin_efficiency = 0.85;
    let a_base = l_xy_total * l_xy_total;
    let a_fin_per_unit = 2.0 * fin_height * l_xy_total;
    let a_fins_total = n_fins_x * a_fin_per_unit;
    let a_total_effective = a_base + fin_efficiency * a_fins_total;
    let fin_area_multiplier = a_total_effective / a_base;

    let u_air = 4.0;
    let nu = 1.5e-5;
    let k_air = 0.026;
    let pr: f64 = 0.71;

    let calc_h = |re_l: f64, is_bottom: bool| -> f64 {
        if is_bottom {
            let nu_l: f64 = 0.037 * re_l.powf(0.8) * pr.powf(1.0 / 3.0);
            nu_l * k_air / l_xy_total
        } else {
            let nu_l: f64 = 0.664 * re_l.powf(0.5) * pr.powf(1.0 / 3.0);
            nu_l * k_air / l_xy_total
        }
    };

    let h_top = calc_h(u_air * l_xy_total / nu, false);
    let h_side = calc_h(u_air * l_xy_total / nu, false);
    let h_bottom = calc_h(u_air * l_xy_total / nu, true) * fin_area_multiplier;

    let mut diag_vals_base = vec![0.0; n_total];

    for k in 0..nz {
        for i in 0..n_xy {
            for j in 0..n_xy {
                let curr = get_idx(i, j, k);

                // Helper for connectivity
                let mut add_conn = |next: usize, area: f64, dist: f64| {
                    let k_eff = 2.0 / (1.0 / kt_vec[curr] + 1.0 / kt_vec[next]);
                    let cond = k_eff * area / dist;
                    coo.push(curr, next, -cond);
                    coo.push(next, curr, -cond);
                    diag_vals_base[curr] += cond;
                    diag_vals_base[next] += cond;
                };

                // Y Neighbor (j+1)
                if j < n_xy - 1 {
                    add_conn(get_idx(i, j + 1, k), get_ay(i, k), dy);
                }
                // X Neighbor (i+1)
                if i < n_xy - 1 {
                    add_conn(get_idx(i + 1, j, k), get_ax(j, k), dx);
                }
                // Z Neighbor (k+1)
                if k < nz - 1 {
                    add_conn(get_idx(i, j, k + 1), get_az(i, j), z[k + 1] - z[k]);
                }

                // Convection
                let mut add_h = |h: f64, area: f64| {
                    diag_vals_base[curr] += h * area;
                    b_base[curr] += h * area * T_INFINITY_K;
                };

                if k == nz - 1 {
                    add_h(h_top, get_az(i, j));
                }
                if k == 0 {
                    add_h(h_bottom, get_az(i, j));
                }
                if i == n_xy - 1 {
                    add_h(h_side, get_ax(j, k));
                }
                if j == n_xy - 1 {
                    add_h(h_side, get_ay(i, k));
                }
            }
        }
    }

    for i in 0..n_total {
        coo.push(i, i, diag_vals_base[i]);
    }
    let l_matrix_base = CsrMatrix::from(&coo);

    // --- 7. NEWTON-RAPHSON SOLVER ---

    let mut t_vec = DVector::from_element(n_total, T_INFINITY_K);
    let max_newton_iter = 50;
    let tol_abs = 1e-4;

    // Solver Buffers
    let mut r = DVector::zeros(n_total);
    let mut b_rad_val = DVector::zeros(n_total);
    let mut diag_rad_deriv = DVector::zeros(n_total);

    // Extract base diagonal for Jacobi Preconditioner
    let mut base_diag = vec![0.0; n_total];
    for (row_idx, row) in l_matrix_base.row_iter().enumerate() {
        let cols = row.col_indices();
        let vals = row.values();
        for (c, &val) in cols.iter().zip(vals) {
            if *c == row_idx {
                base_diag[row_idx] = val;
                break;
            }
        }
    }

    // Reusable CG buffers
    let mut delta = DVector::zeros(n_total);
    let mut p = DVector::zeros(n_total);
    let mut z_cg = DVector::zeros(n_total);
    let mut ap = DVector::zeros(n_total);
    let mut r_cg = DVector::zeros(n_total);
    let t4_inf = T_INFINITY_K.powi(4);

    for _iter in 0..max_newton_iter {
        // 1. Calculate Radiation Terms
        b_rad_val.fill(0.0);
        diag_rad_deriv.fill(0.0);

        for rb in &rad_boundaries {
            let t = t_vec[rb.idx];
            let t2 = t * t;
            let t3 = t2 * t;
            let t4 = t3 * t;

            // Matches MATLAB: const * (T_inf^4 - T^4)
            b_rad_val[rb.idx] = rb.factor * (t4_inf - t4);
            // Derivative d(RHS)/dT = -4 * const * T^3
            // Jacobian J = L - d(RHS)/dT = L + 4 * const * T^3
            diag_rad_deriv[rb.idx] = rb.factor * 4.0 * t3;
        }

        // 2. Calculate Residual
        // R = L*T - b_base - b_rad_val
        r = &l_matrix_base * &t_vec;
        r -= &b_base;
        r -= &b_rad_val;

        let res_norm = r.amax();
        if res_norm < tol_abs {
            break;
        }

        // 3. Solve Linear System: J * delta = -R
        // We solve J * delta = r_cg, where r_cg = -R
        delta.fill(0.0);
        r_cg.copy_from(&r);
        r_cg.scale_mut(-1.0);

        // Preconditioned CG Loop
        // Preconditioner M^-1 = 1 / (BaseDiag + RadDeriv)
        for i in 0..n_total {
            let m_val = base_diag[i] + diag_rad_deriv[i];
            z_cg[i] = r_cg[i] / m_val;
        }
        p.copy_from(&z_cg);
        let mut rs_old = r_cg.dot(&z_cg);

        // Tighter Inner Loop Tolerance for precision
        for _cg_it in 0..5000 {
            // Compute A * p (Implicitly)
            // A * p = L_base * p + diag_rad_deriv .* p
            ap = &l_matrix_base * &p;
            for i in 0..n_total {
                ap[i] += diag_rad_deriv[i] * p[i];
            }

            let denom = p.dot(&ap);
            if denom.abs() < 1e-25 {
                break;
            }
            let alpha = rs_old / denom;

            delta.axpy(alpha, &p, 1.0);
            r_cg.axpy(-alpha, &ap, 1.0);

            // High precision exit for inner solver to match MATLAB's '\'
            if r_cg.norm() < 1e-12 {
                break;
            }

            // Preconditioner apply
            for i in 0..n_total {
                let m_val = base_diag[i] + diag_rad_deriv[i];
                z_cg[i] = r_cg[i] / m_val;
            }

            let rs_new = r_cg.dot(&z_cg);
            let beta = rs_new / rs_old;

            let p_clone = p.clone();
            p.copy_from(&z_cg);
            p.axpy(beta, &p_clone, 1.0);
            rs_old = rs_new;
        }

        // 4. Update Solution
        t_vec += &delta;

        // Safety clamp
        for val in t_vec.iter_mut() {
            if *val < 1.0 {
                *val = 273.15;
            }
        }
    }

    // --- 8. Post Processing ---
    let t_celsius: Vec<f64> = t_vec.data.as_vec().iter().map(|&k| k - 273.15).collect();
    let t_max = t_vec.max() - 273.15;

    // Power Calculation
    let n_vis = 200;
    let x_vis_lin = linspace(-l_xy, l_xy, n_vis);
    let y_vis_lin = linspace(-l_xy, l_xy, n_vis);
    let da_vis = (x_vis_lin[1] - x_vis_lin[0]) * (y_vis_lin[1] - y_vis_lin[0]);

    let mut p_elec_total = 0.0;
    for j in 0..n_vis {
        let yv = y_vis_lin[j];
        for i in 0..n_vis {
            let xv = x_vis_lin[i];
            let mut is_cpv = false;
            for p in 0..n_cpv_total {
                let (ccx, ccy) = centers[p];
                let radius = cell_rads[p];
                let dist_x = (xv - ccx).abs();
                let dist_y = (yv - ccy).abs();

                let is_in_shape = if use_circular_cpv {
                    (dist_x * dist_x) + (dist_y * dist_y) <= (radius * radius)
                } else {
                    dist_x <= radius && dist_y <= radius
                };

                if is_in_shape {
                    is_cpv = true;
                    break;
                }
            }
            if is_cpv {
                let mut q_incident = 0.0;
                for p in 0..n_cpv_total {
                    let (ccx, ccy) = centers[p];
                    let r2 = (xv - ccx).powi(2) + (yv - ccy).powi(2);
                    q_incident += a_cpv * (-r2 / (2.0 * sigma_g.powi(2))).exp();
                }
                let q_tot = Q_SOLAR + q_incident;
                let eff = eta_cell(q_tot / 1000.0);
                p_elec_total += q_tot * eff * da_vis;
            }
        }
    }

    SimulationResult {
        t_max,
        p_elec_total,
        t_3d_flat: t_celsius,
        nx: n_xy,
        ny: n_xy,
        nz,
    }
}
